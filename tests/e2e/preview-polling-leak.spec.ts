import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, refreshDatabase, loginUser } from "../setup";
import path from "path";
import { fileURLToPath } from "url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const testFilePath = path.join(testDir, "..", "fixtures", "test-image.jpg");

const POLLING_INTERVAL_MS = 4000;

/**
 * Creates an asset with an uploaded file and waits until preview image
 * polling is active. Returns the edit page URL so tests can navigate back.
 */
async function createAssetWithUploadAndWaitForPolling(
  page: import("@playwright/test").Page,
): Promise<string> {
  const menuToggle = page.getByRole("button", { name: "Toggle main menu" });
  await menuToggle.click();
  await page.getByRole("button", { name: "Manage Assets" }).click();
  await page.getByText("Add Asset").click();
  await expect(page).toHaveURL(/\/assetManager\/addAsset/);

  const templateSelect = page.getByLabel("Template");
  await templateSelect.selectOption({ index: 1 });
  const collectionSelect = page.getByLabel("Collection");
  await collectionSelect.selectOption({ index: 1 });

  const continueButton = page.getByRole("button", { name: "Continue" });
  await expect(continueButton).toBeEnabled({ timeout: 5000 });
  await continueButton.click();

  await expect(
    page.getByRole("heading", { name: "Create Asset" }),
  ).toBeVisible();

  await page.getByLabel("Title").first().fill("Polling Leak Test Asset");

  // Start listening for the polling request before upload triggers it
  const pollingStarted = page.waitForRequest(
    (req) => req.url().includes("previewImageAvailable"),
    { timeout: POLLING_INTERVAL_MS * 5 },
  );

  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(testFilePath);

  await expect(page.getByText("test-image.jpg")).toBeVisible({
    timeout: 15000,
  });

  // Wait for auto-save redirect to edit page
  await expect(page).toHaveURL(/\/assetManager\/editAsset\//);

  // Wait for polling to actually start
  await pollingStarted;

  return page.url();
}

test.describe("Preview image polling cleanup", () => {
  test.beforeEach(async ({ page, request }) => {
    await page.route("**/arcgis.com/**", (route) => route.abort());
    await page.route("**/basemaps-api.arcgis.com/**", (route) => route.abort());

    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });
    await page.goto("/");
  });

  test("polling stops after navigating away from asset editor", async ({
    page,
  }) => {
    test.setTimeout(30_000);

    await createAssetWithUploadAndWaitForPolling(page);

    // SPA-navigate away via the logo RouterLink (not page.goto which
    // does a full reload and destroys the Vue app — that would mask the
    // bug since the Pinia store only survives SPA navigation).
    await page.locator(".app-header__logo-link").click();
    await expect(page).not.toHaveURL(/\/assetManager\/editAsset/);

    // Count any previewImageAvailable requests that occur after navigation.
    // Wait for 2 full polling cycles — if polling leaked, we'd see requests.
    let postNavRequests = 0;
    page.on("request", (req) => {
      if (req.url().includes("previewImageAvailable")) {
        postNavRequests++;
      }
    });

    await page.waitForTimeout(POLLING_INTERVAL_MS * 2.5);

    expect(postNavRequests).toBe(0);
  });

  test("polling resumes after navigating back to the asset", async ({
    page,
  }) => {
    test.setTimeout(30_000);

    const editUrl = await createAssetWithUploadAndWaitForPolling(page);

    // SPA-navigate away
    await page.locator(".app-header__logo-link").click();
    await expect(page).not.toHaveURL(/\/assetManager\/editAsset/);

    // Navigate back to the same asset (full navigation is fine here —
    // we just need to confirm polling starts fresh)
    await page.goto(editUrl);
    await expect(page).toHaveURL(/\/assetManager\/editAsset\//);

    // Polling should restart — wait for a previewImageAvailable request
    const pollingResumed = page.waitForRequest(
      (req) => req.url().includes("previewImageAvailable"),
      { timeout: POLLING_INTERVAL_MS * 3 },
    );

    await expect(pollingResumed).resolves.toBeTruthy();
  });
});
