import { test, expect, type Page } from "@playwright/test";
import { setupWorkerHTTPHeader, refreshDatabase, loginUser } from "../setup";
import { fileURLToPath } from "url";
import path from "path";

const testDir = path.dirname(fileURLToPath(import.meta.url));

const SUBMISSION_URL_PART = "/assetManager/submission/";
const FILE_METADATA_URL_PART = "/fileManager/getMetadataForObject/";
const COMPLETE_SOURCE_FILE_URL_PART = "/assetManager/completeSourceFile/";

test.describe("Upload widget file metadata", () => {
  test.beforeEach(async ({ page, request }) => {
    await page.route("**/arcgis.com/**", (route) => route.abort());
    await page.route("**/basemaps-api.arcgis.com/**", (route) => route.abort());

    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });
    await page.goto("/assetManager/addAsset");
  });

  test("requests file metadata only after the save that makes it answerable", async ({
    page,
  }) => {
    const metadataRequests = watchMetadataRequestsAroundSave(page);
    const submission = page.waitForResponse((response) =>
      response.url().includes(SUBMISSION_URL_PART)
    );

    const uploadedFileId = await uploadOneFileToNewAsset(page);
    await submission;

    expect(
      metadataRequests.beforeSave,
      "no metadata request goes out ahead of the save"
    ).toEqual([]);

    await expect
      .poll(() => metadataRequests.afterSave, {
        message: "the gate opens once the save lands",
      })
      .toContain(uploadedFileId);
  });
});

/**
 * Records the file ids asked about, split by whether the save that authorizes
 * them had already landed.
 */
function watchMetadataRequestsAroundSave(page: Page): {
  beforeSave: string[];
  afterSave: string[];
} {
  let hasSubmissionCompleted = false;
  const beforeSave: string[] = [];
  const afterSave: string[] = [];

  page.on("response", (response) => {
    if (response.url().includes(SUBMISSION_URL_PART)) {
      hasSubmissionCompleted = true;
    }
  });

  page.on("request", (request) => {
    if (!request.url().includes(FILE_METADATA_URL_PART)) {
      return;
    }

    const requestedFileId = fileIdFromUrl(request.url());
    if (hasSubmissionCompleted) {
      afterSave.push(requestedFileId);
      return;
    }

    beforeSave.push(requestedFileId);
  });

  return { beforeSave, afterSave };
}

/** Returns the id of the file that was uploaded. */
async function uploadOneFileToNewAsset(page: Page): Promise<string> {
  await page.getByLabel("Template").selectOption({ index: 1 });
  await page.getByLabel("Collection").selectOption({ index: 1 });

  const continueButton = page.getByRole("button", { name: "Continue" });
  await expect(continueButton).toBeEnabled({ timeout: 5000 });
  await continueButton.click();

  await expect(
    page.getByRole("heading", { name: "Create Asset" })
  ).toBeVisible();
  await page.getByLabel("Title").first().fill("File metadata test asset");

  const uploadWidget = page
    .locator("section.edit-widget-layout")
    .filter({ has: page.getByRole("heading", { name: "Upload" }) })
    .first();
  await uploadWidget.scrollIntoViewIfNeeded();

  const sourceFileCompletion = page.waitForRequest((request) =>
    request.url().includes(COMPLETE_SOURCE_FILE_URL_PART)
  );

  const fileChooserPromise = page.waitForEvent("filechooser");
  await uploadWidget.getByRole("button", { name: "browse files" }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(
    path.join(testDir, "..", "fixtures", "test-image.jpg")
  );

  await expect(uploadWidget.locator(".edit-upload-widget-item")).toHaveCount(1);

  return fileIdFromUrl((await sourceFileCompletion).url());
}

function fileIdFromUrl(url: string): string {
  return new URL(url).pathname.split("/").filter(Boolean).pop() ?? "";
}
