import { test, expect, type Page } from "@playwright/test";
import {
  setupWorkerHTTPHeader,
  loginUser,
  refreshDatabase,
  getAssetCount,
} from "../setup";

// A create sends an empty objectId, so a non-empty one names an asset that
// already exists.
type RecordedSave = { objectId: string };

const SAVE_ROUTE = "**/assetManager/submission/**";

/**
 * Records every asset save the page issues, altering none of them.
 *
 * Deliberately duplicated from asset-editor-concurrency.spec.ts instead of
 * shared: that spec also has to hold a save open, and two call sites do not
 * pay for a module.
 */
async function recordSaves(page: Page): Promise<RecordedSave[]> {
  const saves: RecordedSave[] = [];
  await page.route(SAVE_ROUTE, async (route) => {
    const body = route.request().postData() ?? "";
    const objectId = body.match(/"objectId":"([^"]*)"/)?.[1] ?? "(none)";
    saves.push({ objectId });
    await route.continue();
  });
  return saves;
}

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

/**
 * Reaches Add Asset through the app menu, which resolves to the editor's own
 * route record. The component is reused rather than remounted, which is what
 * keeps a stale registration alive. page.goto would remount and reset it.
 */
async function openAddAssetFromMenu(page: Page): Promise<void> {
  const menu = page.locator("#app-menu-navigation");
  if (!(await menu.isVisible())) {
    await page.getByRole("button", { name: "Toggle main menu" }).click();
  }
  await expect(menu).toBeVisible();

  const addAssetLink = page.getByRole("link", { name: "Add Asset" });
  if (!(await addAssetLink.isVisible())) {
    await page.getByRole("button", { name: "Manage Assets" }).click();
  }
  await expect(addAssetLink).toBeVisible();
  await addAssetLink.click();
  await expect(page).toHaveURL(/\/assetManager\/addAsset/);
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

function parentTitleField(page: Page) {
  return page.getByLabel(/title/i).first();
}

function childTitleField(page: Page) {
  return page.locator(".inline-edit-asset-page").getByLabel(/title/i).first();
}

function saveButton(page: Page) {
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

    // the parent's own save succeeds and says so, which is correct. What is
    // missing is any word about the child that was dropped.
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

    // fill the child and walk away without saving it. Nothing warns here: the
    // route guard only covers uploads, and Add Asset is a route update rather
    // than a leave.
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
