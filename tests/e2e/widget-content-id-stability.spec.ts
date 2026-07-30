import { test, expect, type Page } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";

/**
 * Counts refetches of the saved asset, which is the step that hands the editor
 * the document a save is about. Registered before any save runs, because the
 * refetch can land before a test gets the chance to wait on it.
 */
function countAssetRefetches(page: Page): () => number {
  let refetches = 0;
  page.on("response", (response) => {
    if (response.url().includes("asset/viewAsset/")) refetches += 1;
  });
  return () => refetches;
}

/** Waits until the editor has applied a save, so a remount would have happened. */
async function waitForSaveToLand(
  page: Page,
  refetchesBeforeSave: number,
  refetches: () => number
): Promise<void> {
  await expect.poll(refetches, { timeout: 20000 }).toBeGreaterThan(
    refetchesBeforeSave
  );
  // one frame pins the state update, after which only synchronous work remains
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(resolve))
  );
}

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
    const refetches = countAssetRefetches(page);

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

    const refetchesBeforeCreate = refetches();
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForURL(/\/assetManager\/editAsset\/.+/);
    await waitForSaveToLand(page, refetchesBeforeCreate, refetches);

    // Mark the child's title input. A remount builds a new element, which
    // carries no marker, so the marker surviving is the proof of no remount.
    await childForm
      .getByLabel(/title/i)
      .first()
      .evaluate((input) => {
        (input as HTMLElement).dataset.markedBeforeSave = "yes";
      });

    // change only the parent's own field, so nothing about the child changed
    const refetchesBeforeUpdate = refetches();
    await parentTitle.fill("Parent edited");
    await page.getByRole("button", { name: "Save" }).click();
    await waitForSaveToLand(page, refetchesBeforeUpdate, refetches);

    await expect(
      childForm.locator("input[data-marked-before-save='yes']")
    ).toHaveCount(1);
  });
});
