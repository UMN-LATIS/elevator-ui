import { test, expect, type Page } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";

// Asset 1 from the mock data, which lives in Default Collection (id 1)
const ASSET_ID = "6875871d4eb080a4880a0f44";
const DEFAULT_COLLECTION_ID = "1";

const SAVE_ROUTE = "**/assetManager/submission/**";

function collectionSelect(page: Page) {
  // by role, because the confirm dialog's accessible name also contains
  // "Collection" and it stays in the DOM through its leave transition
  return page.getByRole("combobox", { name: "Collection" });
}

function confirmModal(page: Page) {
  return page.getByText("Move Asset to New Collection?");
}

test.describe("collection migration", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });

    await page.goto(`/assetManager/editAsset/${ASSET_ID}`);
    await expect(collectionSelect(page)).toHaveValue(DEFAULT_COLLECTION_ID);
  });

  test("canceling the confirm puts the selection back on the asset's collection", async ({
    page,
  }) => {
    await collectionSelect(page).selectOption({ label: "Parent Collection" });
    await expect(confirmModal(page)).toBeVisible();

    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(confirmModal(page)).not.toBeVisible();
    await expect(collectionSelect(page)).toHaveValue(DEFAULT_COLLECTION_ID);
  });

  test("a failed migration save reverts the collection edit instead of leaving it pending", async ({
    page,
  }) => {
    test.setTimeout(30_000);

    // fail only the migration's save. 400 rather than 500, because a 500
    // raises the blocking connection-error modal on top of the toast this
    // test is about
    let shouldFailNextSave = true;
    const saveBodies: string[] = [];
    await page.route(SAVE_ROUTE, async (route) => {
      if (shouldFailNextSave) {
        shouldFailNextSave = false;
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ message: "migration rejected" }),
        });
        return;
      }
      saveBodies.push(route.request().postData() ?? "");
      await route.continue();
    });

    await collectionSelect(page).selectOption({ label: "Parent Collection" });
    await expect(confirmModal(page)).toBeVisible();
    await page.getByRole("button", { name: "Confirm" }).click();

    await expect(
      page.locator(".toast-root").getByText(/Failed to move asset/)
    ).toBeVisible({ timeout: 10000 });

    // still on the edit page, and the selection fell back to the real
    // collection
    await expect(page).toHaveURL(
      new RegExp(`/assetManager/editAsset/${ASSET_ID}`)
    );
    await expect(collectionSelect(page)).toHaveValue(DEFAULT_COLLECTION_ID);

    // the failed migration must not ride along on the next save
    const titleField = page.getByLabel(/title/i).first();
    await titleField.fill("Asset 1 after failed migration");
    await page.getByRole("button", { name: "Save" }).click();

    await expect.poll(() => saveBodies.length, { timeout: 15000 }).toBe(1);
    expect(saveBodies[0]).toContain(
      `"collectionId":"${DEFAULT_COLLECTION_ID}"`
    );
  });
});
