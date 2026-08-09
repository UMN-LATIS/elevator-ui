import { test, expect, type Page } from "@playwright/test";
import {
  setupWorkerHTTPHeader,
  loginUser,
  refreshDatabase,
  getAssetCount,
  recordSaves,
  SAVE_ROUTE,
} from "../setup";

const ASSET_FETCH_ROUTE = "**/asset/viewAsset/**";

/**
 * Fails only the first asset fetch after this point, which is the read the
 * editor issues to take the saved document back in. 404 rather than 500,
 * because vue-query retries 500s and the retries hide the failure.
 */
async function failNextAssetFetch(page: Page): Promise<void> {
  let hasFailed = false;
  await page.route(ASSET_FETCH_ROUTE, async (route) => {
    if (hasFailed) {
      await route.continue();
      return;
    }
    hasFailed = true;
    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ error: "not found" }),
    });
  });
}

test.describe("retrying a create whose follow-up read failed", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });
  });

  test("does not create a second asset", async ({ page, request }) => {
    test.setTimeout(30_000);
    const workerId = test.info().workerIndex.toString();
    const initialAssetCount = await getAssetCount({ request, workerId });
    const saves = await recordSaves(page);

    await page.goto("/assetManager/addAsset");
    // a template with no inline related asset, so exactly one editor saves
    await page.getByLabel("Template").selectOption({ label: "Some Fields" });
    await page.getByLabel("Collection").selectOption({ index: 1 });
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByLabel(/title/i).first().fill("Asset that must exist once");

    // the read back of the stored document fails, but the editor committed
    // the new assetId before that read, so the save still succeeds: the page
    // moves to the asset's edit URL and keeps showing the document it sent
    await failNextAssetFetch(page);
    const firstSave = page.waitForResponse(SAVE_ROUTE);
    await page.getByRole("button", { name: "Save" }).click();
    await firstSave;
    await expect(page).toHaveURL(/\/assetManager\/editAsset\/.+/);
    await expect(page.getByText(/failed to save/i)).not.toBeVisible();

    const secondSave = page.waitForResponse(SAVE_ROUTE);
    await page.getByRole("button", { name: "Save" }).click();
    await secondSave;

    // the retry must update the asset the first save created, not make
    // another one
    await expect
      .poll(async () => getAssetCount({ request, workerId }))
      .toBe(initialAssetCount + 1);
    expect(saves).toHaveLength(2);
    // the retry names the asset the first save created
    expect(saves[1].objectId).toMatch(/^[0-9a-f-]{24,36}$/);
  });
});
