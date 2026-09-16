import { test, expect } from "@playwright/test";
import {
  setupWorkerHTTPHeader,
  loginUser,
  refreshDatabase,
  startCountingAssetRefetches,
  waitForSaveToLand,
} from "../setup";

test.describe("widget content ids across a save", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });
  });

  test("saving the parent leaves the inline related asset mounted", async ({
    page,
  }) => {
    test.setTimeout(30_000);
    const countAssetRefetches = startCountingAssetRefetches(page);

    await page.goto("/assetManager/addAsset");
    await page
      .getByLabel("Template")
      .selectOption({ label: "Inline Parent Template" });
    await page.getByLabel("Collection").selectOption({ index: 1 });
    await page.getByRole("button", { name: "Continue" }).click();

    const childForm = page.locator(".inline-edit-asset-page");
    await expect(
      childForm.locator("h3", { hasText: "Inline Child Template" })
    ).toBeVisible();

    const parentTitle = page.getByLabel(/title/i).first();
    const childTitle = childForm.getByLabel(/title/i).first();
    await parentTitle.fill("Parent");
    await childTitle.fill("Child");

    const refetchesBeforeCreate = countAssetRefetches();
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForURL(/\/assetManager\/editAsset\/.+/);
    await waitForSaveToLand(page, refetchesBeforeCreate, countAssetRefetches);

    // Mark the child's title input. A remount builds a new element, which
    // carries no marker, so the marker surviving is the proof of no remount.
    await childForm
      .getByLabel(/title/i)
      .first()
      .evaluate((input) => {
        (input as HTMLElement).dataset.markedBeforeSave = "yes";
      });

    // change only the parent's own field, so nothing about the child changed
    const refetchesBeforeUpdate = countAssetRefetches();
    await parentTitle.fill("Parent edited");
    await page.getByRole("button", { name: "Save" }).click();
    await waitForSaveToLand(page, refetchesBeforeUpdate, countAssetRefetches);

    await expect(
      childForm.locator("input[data-marked-before-save='yes']")
    ).toHaveCount(1);
  });
});
