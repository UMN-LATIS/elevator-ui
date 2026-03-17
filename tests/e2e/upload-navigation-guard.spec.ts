import { test, expect, type Page } from "@playwright/test";
import { setupWorkerHTTPHeader, refreshDatabase, loginUser } from "../setup";
import { fileURLToPath } from "url";
import path from "path";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const fixtureFile = path.join(testDir, "..", "fixtures", "test-image.jpg");

// Long enough to interact with the modal, short enough to keep tests fast.
const DEFAULT_UPLOAD_DELAY_MS = 8_000;

/**
 * Pick a file and start uploading it, but delay the S3 part PUT so the upload
 * stays in-flight long enough to test navigation guards. Resolves once the
 * part request has fired (hasActiveUploads is guaranteed true at that point).
 */
async function startUploadAndWaitUntilInFlight(
  page: Page,
  delayMs = DEFAULT_UPLOAD_DELAY_MS,
) {
  await page.route("**/s3/upload-part/**", async (route) => {
    await new Promise((r) => setTimeout(r, delayMs));
    await route.continue();
  });

  // Wait for the upload to start before proceeding with the test.
  const inProgress = page.waitForRequest("**/s3/upload-part/**");

  // Filter to the top-level "Upload" widget (not any nested one).
  const widget = page
    .locator("section.edit-widget-layout")
    .filter({ has: page.getByRole("heading", { name: "Upload" }) })
    .first();

  // Scroll the widget into view so the button is interactable
  await widget.scrollIntoViewIfNeeded();

  // start the upload by picking a file
  const chooserPromise = page.waitForEvent("filechooser");
  await widget.getByRole("button", { name: "browse files" }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles(fixtureFile);

  // Wait until the upload has officially started
  // that is, when the S3 part request has fired and is in-flight
  // Then we can test what happens when an upload is active
  await inProgress;
}

// Trigger SPA navigation via the logo RouterLink (fires onBeforeRouteLeave,
// not a full page reload).
async function navigateHome(page: Page) {
  await page.locator(".app-header__logo-link").click();
}

test.describe("Upload navigation guard", () => {
  test.beforeEach(async ({ page, request }) => {
    await page.route("**/arcgis.com/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "{}" })
    );
    await page.route("**/basemaps-api.arcgis.com/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "{}" })
    );

    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });

    await page.goto("/assetManager/addAsset");
    await page.getByLabel("Template").selectOption({ index: 1 });
    await page.getByLabel("Collection").selectOption({ index: 1 });
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(
      page.getByRole("heading", { name: "Create Asset" })
    ).toBeVisible();
  });

  test("shows confirm modal when navigating in-app during upload", async ({
    page,
  }) => {
    test.setTimeout(30_000);

    // Log all requests to understand timing
    const requests: string[] = [];
    page.on("request", (req) => requests.push(`${req.method()} ${req.url()}`));

    await startUploadAndWaitUntilInFlight(page);

    // try to navigate away while upload is in-flight
    await navigateHome(page);

    await expect(
      page.getByRole("heading", { name: "Upload in progress" })
    ).toBeVisible();
  });

  test("stays on page when user clicks Stay", async ({ page }) => {
    test.setTimeout(30_000);

    await startUploadAndWaitUntilInFlight(page);

    // try to navigate away while upload is in-flight
    await navigateHome(page);

    // Click "Stay" to cancel navigation and keep uploading
    await page.getByRole("button", { name: "Stay" }).click();

    await expect(
      page.getByRole("heading", { name: "Upload in progress" })
    ).not.toBeVisible();
    await expect(page).toHaveURL(/\/assetManager\/addAsset/);
  });

  test("allows navigation when user clicks Leave", async ({ page }) => {
    test.setTimeout(30_000);

    await startUploadAndWaitUntilInFlight(page);

    // try to navigate away, and click leave
    await navigateHome(page);
    await page.getByRole("button", { name: "Leave" }).click();

    await expect(page).not.toHaveURL(/\/assetManager\/addAsset/);
  });

  test("no modal after upload has completed", async ({ page }) => {
    test.setTimeout(30_000);

    await startUploadAndWaitUntilInFlight(page, 500);

    // Wait for the upload to fully complete (part finishes → completeMultipartUpload).
    await page.waitForResponse("**/s3/multipart/*/complete");

    await navigateHome(page);

    await expect(page.getByText("Upload in progress")).not.toBeVisible();
    await expect(page).not.toHaveURL(/\/assetManager\/addAsset/);
  });

  test("triggers browser native dialog when reloading during upload", async ({
    page,
  }) => {
    test.setTimeout(30_000);

    await startUploadAndWaitUntilInFlight(page);

    const dialogPromise = page.waitForEvent("dialog");
    // Reload is browser-level navigation — triggers beforeunload, not onBeforeRouteLeave.
    // Don't await: the dialog must be handled before reload can proceed.
    page.reload().catch(() => {});

    const dialog = await dialogPromise;
    expect(dialog.type()).toBe("beforeunload");
    await dialog.dismiss();

    await expect(page).toHaveURL(/\/assetManager\/addAsset/);
  });
});
