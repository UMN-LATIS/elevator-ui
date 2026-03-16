import { test, expect, type Page } from "@playwright/test";
import { setupWorkerHTTPHeader, refreshDatabase, loginUser } from "../setup";
import { fileURLToPath } from "url";
import path from "path";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const fixtureFile = path.join(testDir, "..", "fixtures", "test-image.jpg");

// Pause the multipart complete endpoint so the upload stays in-progress
// indefinitely. Returns a promise that resolves once the upload has reached
// that endpoint — i.e. the upload is genuinely registered in the store.
async function pauseUploadAtComplete(page: Page) {
  await page.route("**/s3/multipart/*/complete", async (route) => {
    await new Promise((r) => setTimeout(r, 30_000));
    await route.continue();
  });
  return page.waitForRequest("**/s3/multipart/*/complete");
}

async function startUpload(page: Page) {
  const widget = page.locator("section.edit-widget-layout").first();
  await widget.scrollIntoViewIfNeeded();
  const chooserPromise = page.waitForEvent("filechooser");
  await widget.getByRole("button", { name: "browse files" }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles(fixtureFile);
}

// Trigger SPA navigation by clicking the app logo (a RouterLink to "/").
// This fires onBeforeRouteLeave without causing a full page reload.
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

    const inProgress = pauseUploadAtComplete(page);
    await startUpload(page);
    await inProgress;

    await navigateHome(page);

    await expect(
      page.getByRole("heading", { name: "Upload in progress" })
    ).toBeVisible();
  });

  test("stays on page when user clicks Stay", async ({ page }) => {
    test.setTimeout(30_000);

    const inProgress = pauseUploadAtComplete(page);
    await startUpload(page);
    await inProgress;

    await navigateHome(page);
    await page.getByRole("button", { name: "Stay" }).click();

    await expect(
      page.getByRole("heading", { name: "Upload in progress" })
    ).not.toBeVisible();
    await expect(page).toHaveURL(/\/assetManager\/addAsset/);
  });

  test("allows navigation when user clicks Leave", async ({ page }) => {
    test.setTimeout(30_000);

    const inProgress = pauseUploadAtComplete(page);
    await startUpload(page);
    await inProgress;

    await navigateHome(page);
    await page.getByRole("button", { name: "Leave" }).click();

    await expect(page).not.toHaveURL(/\/assetManager\/addAsset/);
  });

  test("no modal when navigating without an active upload", async ({
    page,
  }) => {
    // Navigate home without starting any upload
    await navigateHome(page);

    // Should navigate immediately — no modal
    await expect(
      page.getByText("Upload in progress")
    ).not.toBeVisible();
    await expect(page).not.toHaveURL(/\/assetManager\/addAsset/);
  });

  test("triggers browser native dialog when reloading during upload", async ({
    page,
  }) => {
    test.setTimeout(30_000);

    const inProgress = pauseUploadAtComplete(page);
    await startUpload(page);
    await inProgress;

    const dialogPromise = page.waitForEvent("dialog");
    // Reload is a browser-level navigation, triggering beforeunload rather than
    // onBeforeRouteLeave. We fire it without awaiting so the dialog can surface.
    page.reload().catch(() => {});

    const dialog = await dialogPromise;
    expect(dialog.type()).toBe("beforeunload");
    await dialog.dismiss();

    // User dismissed — still on the upload page
    await expect(page).toHaveURL(/\/assetManager\/addAsset/);
  });
});
