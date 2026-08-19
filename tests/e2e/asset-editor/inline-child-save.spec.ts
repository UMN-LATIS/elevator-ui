import { test, expect, type Locator, type Page } from "@playwright/test";
import {
  setupWorkerHTTPHeader,
  loginUser,
  refreshDatabase,
  getAssetCount,
  openAddAssetFromMenu,
  recordSaves,
  SAVE_ROUTE,
} from "../../setup";

/** Fails only the first save, which is the inline child's. */
async function failFirstSave(page: Page): Promise<void> {
  let hasFailedOne = false;
  await page.route(SAVE_ROUTE, async (route) => {
    if (hasFailedOne) {
      await route.continue();
      return;
    }
    hasFailedOne = true;
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "inline child save failed" }),
    });
  });
}

/** Starts a draft on the template whose only related asset widget is inline. */
async function startInlineParentDraft(page: Page): Promise<void> {
  await page
    .getByLabel("Template")
    .selectOption({ label: "Inline Parent Template" });
  await page.getByLabel("Collection").selectOption({ index: 1 });

  const continueButton = page.getByRole("button", { name: "Continue" });
  await expect(continueButton).toBeEnabled();
  await continueButton.click();

  // the child's own editor finished initializing once it names its template
  await expect(
    page.locator(".inline-edit-asset-page h3", {
      hasText: "Inline Child Template",
    })
  ).toBeVisible();
}

function parentTitleField(page: Page): Locator {
  return page.getByLabel(/title/i).first();
}

function childTitleField(page: Page): Locator {
  return page.locator(".inline-edit-asset-page").getByLabel(/title/i).first();
}

function saveButton(page: Page): Locator {
  return page.getByRole("button", { name: "Save" });
}

test.describe("inline child editors and the parent save", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });
  });

  test("a failed inline child save raises an error the user can see", async ({
    page,
  }) => {
    await failFirstSave(page);

    await page.goto("/assetManager/addAsset");
    await startInlineParentDraft(page);
    await parentTitleField(page).fill("Parent whose child save fails");
    await childTitleField(page).fill("Child that cannot be saved");

    await saveButton(page).click();

    // the parent's own save succeeds and says so, so the child's failure
    // needs a toast of its own
    await expect(
      page.locator(".toast-root").getByText(/Failed to save inline asset/)
    ).toBeVisible({ timeout: 10000 });
  });

  test("saving a new draft does not write to the previous asset's inline child", async ({
    page,
  }) => {
    // two creates plus the save queue's cooldown run past the default timeout
    test.setTimeout(30_000);

    const saves = await recordSaves(page);

    await page.goto("/assetManager/addAsset");
    await startInlineParentDraft(page);
    await parentTitleField(page).fill("First parent");
    await childTitleField(page).fill("First child");
    await saveButton(page).click();
    await page.waitForURL(/\/assetManager\/editAsset\/.+/);

    await openAddAssetFromMenu(page);
    await startInlineParentDraft(page);
    await parentTitleField(page).fill("Second parent");

    const savesBeforeSecondParent = saves.length;
    await saveButton(page).click();
    await page.waitForURL(/\/assetManager\/editAsset\/.+/);
    await expect
      .poll(() => saves.length)
      .toBeGreaterThan(savesBeforeSecondParent);

    // the user is creating a second asset, so every save from here is a
    // create. One carrying an objectId is a write to an asset they left.
    expect(
      saves
        .slice(savesBeforeSecondParent)
        .filter((save) => save.objectId !== "")
    ).toEqual([]);
  });

  test("clearing an existing inline child's content still saves that child", async ({
    page,
  }) => {
    test.setTimeout(30_000);

    const saves = await recordSaves(page);

    await page.goto("/assetManager/addAsset");
    await startInlineParentDraft(page);
    await parentTitleField(page).fill("Parent of a child being emptied");
    await childTitleField(page).fill("Content the user deletes");
    await saveButton(page).click();
    await page.waitForURL(/\/assetManager\/editAsset\/.+/);

    const parentAssetId = page.url().match(/editAsset\/([^/?#]+)/)?.[1] ?? "";
    expect(parentAssetId).not.toBe("");

    // the child editor holds its saved asset once the first save settles.
    // Clearing any earlier would edit a draft that save then overwrites
    await expect(childTitleField(page)).toHaveValue("Content the user deletes");

    await childTitleField(page).fill("");

    const savesBeforeClear = saves.length;
    await saveButton(page).click();

    // the parent saves itself unconditionally. The now-blank child must be
    // saved too, as an update carrying its own assetId
    await expect
      .poll(
        () =>
          saves
            .slice(savesBeforeClear)
            .filter(
              (save) => save.objectId !== "" && save.objectId !== parentAssetId
            ).length,
        { timeout: 15000 }
      )
      .toBeGreaterThan(0);
  });

  test("an abandoned inline child draft is not created by a later asset's save", async ({
    page,
    request,
  }) => {
    test.setTimeout(30_000);

    const workerId = test.info().workerIndex.toString();

    await page.goto("/assetManager/addAsset");
    await startInlineParentDraft(page);
    await parentTitleField(page).fill("First parent");
    await saveButton(page).click();
    await page.waitForURL(/\/assetManager\/editAsset\/.+/);

    // fill the child and walk away without saving it. The typed draft is
    // unsaved work the session tree can see, so leaving takes a confirmation.
    await childTitleField(page).fill("Child the user abandoned");
    await openAddAssetFromMenu(page);

    await startInlineParentDraft(page);
    await parentTitleField(page).fill("Second parent");

    const countBefore = await getAssetCount({ request, workerId });
    await saveButton(page).click();
    await page.waitForURL(/\/assetManager\/editAsset\/.+/);

    // the second parent is the only asset asked for. Its own inline child is
    // untouched, so it is not saved, and the abandoned draft belongs to an
    // editor that is gone.
    await expect
      .poll(() => getAssetCount({ request, workerId }), { timeout: 15000 })
      .toBe(countBefore + 1);
  });
});
