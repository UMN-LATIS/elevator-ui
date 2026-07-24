import { test, expect, type Page } from "@playwright/test";
import { setupWorkerHTTPHeader, refreshDatabase, loginUser } from "../setup";
import { fileURLToPath } from "url";
import path from "path";

const testDir = path.dirname(fileURLToPath(import.meta.url));

const SUBMISSION_URL_PART = "/assetManager/submission/";
const FILE_METADATA_URL_PART = "/fileManager/getMetadataForObject/";

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

  test("does not request file metadata before the asset is saved", async ({
    page,
  }) => {
    const metadataRequests = watchMetadataRequestsAroundSave(page);

    await uploadOneFileToNewAsset(page);

    expect(metadataRequests.beforeSave).toEqual([]);
  });

  test("requests file metadata once the asset is saved", async ({ page }) => {
    const metadataRequests = watchMetadataRequestsAroundSave(page);

    await uploadOneFileToNewAsset(page);

    expect(metadataRequests.afterSave.length).toBeGreaterThan(0);
  });
});

/**
 * Splits file metadata requests by whether the save that authorizes them had
 * already landed.
 *
 * The API can only answer for a file once a save has linked it to its parent
 * asset, so a request in `beforeSave` is one the server was always going to
 * reject. An empty `afterSave` means the widget stopped asking altogether.
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

    if (hasSubmissionCompleted) {
      afterSave.push(request.url());
      return;
    }

    beforeSave.push(request.url());
  });

  return { beforeSave, afterSave };
}

async function uploadOneFileToNewAsset(page: Page): Promise<void> {
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

  const fileChooserPromise = page.waitForEvent("filechooser");
  await uploadWidget.getByRole("button", { name: "browse files" }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(
    path.join(testDir, "..", "fixtures", "test-image.jpg")
  );

  await expect(uploadWidget.locator(".edit-upload-widget-item")).toHaveCount(1);

  // the save queue holds a 2s cooldown between saves, so the submission this
  // upload triggers has not necessarily gone out yet
  await new Promise((resolve) => setTimeout(resolve, 4000));
  await page.waitForLoadState("networkidle");
}
