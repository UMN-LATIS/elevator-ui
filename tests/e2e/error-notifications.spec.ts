import { test, expect, type Page } from "@playwright/test";
import { setupWorkerHTTPHeader, refreshDatabase, loginUser } from "../setup";

// Asset 1 from the mock db: one saved file in its upload widget, so the edit
// page issues exactly one getMetadataForObject request we can force to fail.
const SINGLE_FILE_ASSET_ID = "6875871d4eb080a4880a0f44";

// Five saved files, so a forced 404 yields one error toast per file.
const MULTI_FILE_ASSET_ID = "glacier_mixed_asset_001";

const METADATA_ROUTE = "**/fileManager/getMetadataForObject/**";

// The friendly text getErrorMessage maps each status to.
const NOT_FOUND_MESSAGE =
  "We couldn't find this. Please check your link and try again.";
const SERVER_ERROR_MESSAGE =
  "There was a problem on our end. Please contact support if the problem persists.";

async function stubMetadataStatus(page: Page, status: number) {
  await page.route(METADATA_ROUTE, (route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ error: "unknownFile" }),
    })
  );
}

test.describe("error notifications by status", () => {
  test.beforeEach(async ({ page, request }) => {
    await page.route("**/arcgis.com/**", (route) => route.abort());
    await page.route("**/basemaps-api.arcgis.com/**", (route) => route.abort());

    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });
  });

  test("a 404 shows a dismissable toast and leaves the page interactive", async ({
    page,
  }) => {
    await stubMetadataStatus(page, 404);

    await page.goto(`/assetManager/editAsset/${SINGLE_FILE_ASSET_ID}`);

    const toastRoot = page.locator(".toast-root");
    const errorModal = page.locator(".error-modal");

    await expect(toastRoot.getByText(NOT_FOUND_MESSAGE)).toBeVisible({
      timeout: 10000,
    });

    await expect(
      errorModal.getByRole("heading", { name: "Error: 404" })
    ).toHaveCount(0);

    // The page behind the toast stays usable: no scrim intercepts input.
    const titleField = page.getByLabel(/title/i).first();
    await titleField.fill("Still editable behind the toast");
    await expect(titleField).toHaveValue("Still editable behind the toast");

    await toastRoot.getByRole("button", { name: "Close" }).click();
    await expect(toastRoot.getByText(NOT_FOUND_MESSAGE)).toHaveCount(0);
  });

  test("a 500 keeps the blocking error modal", async ({ page }) => {
    await stubMetadataStatus(page, 500);

    await page.goto(`/assetManager/editAsset/${SINGLE_FILE_ASSET_ID}`);

    const errorModal = page.locator(".error-modal");

    await expect(
      errorModal.getByRole("heading", { name: "Error: 500" })
    ).toBeVisible({ timeout: 10000 });
    await expect(errorModal.getByText(SERVER_ERROR_MESSAGE)).toBeVisible();
  });

  test("a 410 stays silent: no toast, no modal", async ({ page }) => {
    await stubMetadataStatus(page, 410);

    const metadataFailure = page.waitForResponse((response) =>
      response.url().includes("/fileManager/getMetadataForObject/")
    );
    await page.goto(`/assetManager/editAsset/${SINGLE_FILE_ASSET_ID}`);
    await metadataFailure;

    // Settle a render before asserting nothing appeared.
    await expect(page.getByLabel(/title/i).first()).toBeVisible();

    await expect(page.locator(".toast-root__toast")).toHaveCount(0);
    await expect(page.locator(".error-modal").getByRole("heading")).toHaveCount(
      0
    );
  });

  test("Clear All dismisses every toast at once", async ({ page }) => {
    await stubMetadataStatus(page, 404);

    await page.goto(`/assetManager/editAsset/${MULTI_FILE_ASSET_ID}`);

    // All five failures must land before clearing, or a straggler toast
    // arriving after the click would repopulate the list.
    const toasts = page.locator(".toast-root__toast");
    await expect(toasts).toHaveCount(5, { timeout: 10000 });

    const clearAllButton = page.getByRole("button", { name: "Clear All" });
    await expect(clearAllButton).toBeVisible();

    await clearAllButton.click();

    await expect(toasts).toHaveCount(0);
    await expect(clearAllButton).toHaveCount(0);
  });

  test("Clear All is not offered for a single toast", async ({ page }) => {
    await stubMetadataStatus(page, 404);

    await page.goto(`/assetManager/editAsset/${SINGLE_FILE_ASSET_ID}`);

    const toasts = page.locator(".toast-root__toast");
    await expect(toasts).toHaveCount(1, { timeout: 10000 });

    await expect(page.getByRole("button", { name: "Clear All" })).toHaveCount(
      0
    );
  });
});
