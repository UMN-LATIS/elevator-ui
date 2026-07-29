import { test, expect, type Page } from "@playwright/test";
import path from "path";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";

const ASSET_1_ID = "6875871d4eb080a4880a0f44";

type RecordedSave = { objectId: string; templateId: string };

/**
 * Holds one save open so the test can navigate while it is in flight, until
 * the returned `releaseHeldSave` lets it finish. Every other save passes
 * through.
 *
 * @param heldObjectId - which save to hold, by the asset it targets. An empty
 * string is a create. Omit to record saves without holding any. Only the
 * first match is held, since the editor's save queue can emit trailing saves
 * for the same asset.
 */
async function interceptSaves(
  page: Page,
  heldObjectId?: string
): Promise<{
  saves: RecordedSave[];
  releaseHeldSave: () => void;
  countAssetRefetches: () => number;
}> {
  const saves: RecordedSave[] = [];
  let hasHeldOne = false;
  const { promise: heldSave, resolve: releaseHeldSave } =
    Promise.withResolvers<void>();

  // counted from a listener registered before any save runs, because a refetch
  // can land before a test gets the chance to start waiting on it
  let assetRefetchCount = 0;
  page.on("response", (response) => {
    if (response.url().includes("asset/viewAsset/")) assetRefetchCount += 1;
  });

  await page.route("**/assetManager/submission/**", async (route) => {
    const body = route.request().postData() ?? "";
    const objectId = body.match(/"objectId":"([^"]*)"/)?.[1] ?? "(none)";
    const templateId = body.match(/"templateId":"([^"]*)"/)?.[1] ?? "(none)";
    saves.push({ objectId, templateId });

    if (heldObjectId !== undefined && !hasHeldOne && objectId === heldObjectId) {
      hasHeldOne = true;
      await heldSave;
    }
    await route.continue();
  });

  return {
    saves,
    releaseHeldSave,
    countAssetRefetches: () => assetRefetchCount,
  };
}

/**
 * Releases the held save and waits until the editor has finished applying it.
 *
 * A save resolves in three steps: the submission response, a refetch of the
 * asset, then the state update. The state update is what these tests are
 * about, so the test must not act before it.
 */
async function releaseAndSettle(
  page: Page,
  releaseHeldSave: () => void,
  countAssetRefetches: () => number
): Promise<void> {
  const refetchesBeforeRelease = countAssetRefetches();
  releaseHeldSave();
  // the refetch resolving pins the response and refetch steps. networkidle
  // cannot: it resolves immediately once the page has ever been idle
  await expect
    .poll(() => countAssetRefetches(), { timeout: 20000 })
    .toBeGreaterThan(refetchesBeforeRelease);
  // one frame pins the state update, only synchronous work remains
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(resolve))
  );
}

/**
 * Marks the current end of the save log, so a test can assert only about saves
 * the editor sends from here on. Anchoring on the held save instead would also
 * catch the queue's legitimate trailing save for the asset the user was still
 * editing at the time.
 */
function markSaveLog(saves: RecordedSave[]): () => RecordedSave[] {
  const markedLength = saves.length;
  return () => saves.slice(markedLength);
}

/** Reaches Add Asset from any menu state, waiting for each step to settle. */
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

async function startDraft(page: Page): Promise<void> {
  await page.getByLabel("Template").selectOption({ index: 1 });
  await page.getByLabel("Collection").selectOption({ index: 1 });
  const continueButton = page.getByRole("button", { name: "Continue" });
  await expect(continueButton).toBeEnabled();
  await continueButton.click();
  await expect(page.getByRole("heading", { name: "Create Asset" })).toBeVisible();
}

function titleField(page: Page) {
  return page.getByLabel(/title/i).first();
}

test.describe("Asset editor concurrency", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });
    await page.goto("/");
  });

  test("starting a new draft while the previous asset is still saving does not overwrite the previous asset", async ({
    page,
  }) => {
    const { saves, releaseHeldSave, countAssetRefetches } = await interceptSaves(page, ASSET_1_ID);

    await page.goto(`/assetManager/editAsset/${ASSET_1_ID}`);
    await expect(titleField(page)).toHaveValue("Asset 1");
    await titleField(page).fill("Asset 1 edited before navigating away");

    await page.getByRole("button", { name: "Save" }).click();
    await expect.poll(() => saves.length).toBeGreaterThan(0);

    // Add Asset resolves to the editor's own route record, so the component is
    // reused rather than remounted
    await openAddAssetFromMenu(page);
    await startDraft(page);
    const savesFromDraftOnward = markSaveLog(saves);

    await releaseAndSettle(page, releaseHeldSave, countAssetRefetches);

    await titleField(page).fill("Brand new asset");
    await page.getByRole("button", { name: "Save" }).click();
    await expect.poll(() => savesFromDraftOnward().length).toBeGreaterThan(0);

    // the user is on a new draft, so no save from here may target Asset 1. One
    // that does replaces Asset 1 with the draft's content and template.
    expect(
      savesFromDraftOnward().filter((save) => save.objectId === ASSET_1_ID)
    ).toEqual([]);
  });

  test("a save in flight does not land on the different asset the user moved to", async ({
    page,
  }) => {
    // creating a real asset plus two queue cooldowns runs close to the 10s default
    test.setTimeout(20_000);

    await page.goto(`/assetManager/editAsset/${ASSET_1_ID}`);
    await expect(titleField(page)).toHaveValue("Asset 1");

    // creating from an edit page leaves two edit URLs in history, because the
    // editor replaces the URL once the create returns. Back then moves between
    // two edit pages without remounting the editor.
    await openAddAssetFromMenu(page);
    await startDraft(page);
    await titleField(page).fill("Second asset");
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForURL(/\/assetManager\/editAsset\/.+/);
    const newAssetId = page.url().split("/").pop() as string;
    expect(newAssetId).not.toBe(ASSET_1_ID);

    const { saves, releaseHeldSave, countAssetRefetches } = await interceptSaves(page, newAssetId);
    await titleField(page).fill("Second asset edited before going back");
    await page.getByRole("button", { name: "Save" }).click();
    await expect.poll(() => saves.some((save) => save.objectId === newAssetId)).toBe(true);

    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/assetManager/editAsset/${ASSET_1_ID}`));
    await expect(titleField(page)).toHaveValue("Asset 1");
    const savesFromAsset1Onward = markSaveLog(saves);

    await releaseAndSettle(page, releaseHeldSave, countAssetRefetches);

    await titleField(page).fill("Asset 1 edited after going back");
    await page.getByRole("button", { name: "Save" }).click();
    await expect.poll(() => savesFromAsset1Onward().length).toBeGreaterThan(0);

    // the user is back on Asset 1, so no save from here belongs to the other asset
    expect(
      savesFromAsset1Onward().filter((save) => save.objectId === newAssetId)
    ).toEqual([]);
  });

  test("a create in flight for one draft does not make the next draft adopt its asset", async ({
    page,
  }) => {
    const { saves, releaseHeldSave, countAssetRefetches } = await interceptSaves(page, "");

    // an existing asset to bounce off, since Add Asset does not re-fire the
    // route watcher when the editor is already on the add-asset URL
    await page.goto(`/assetManager/editAsset/${ASSET_1_ID}`);
    await expect(titleField(page)).toHaveValue("Asset 1");

    await openAddAssetFromMenu(page);
    await startDraft(page);
    await titleField(page).fill("First draft");
    await page.getByRole("button", { name: "Save" }).click();
    await expect.poll(() => saves.length).toBeGreaterThan(0);

    // abandon the first draft for a second one while its create is in flight.
    // Back then Forward re-fires the route watcher, which resets the editor.
    await page.goBack();
    await expect(titleField(page)).toHaveValue("Asset 1");
    await page.goForward();
    await expect(page).toHaveURL(/\/assetManager\/addAsset/);
    await startDraft(page);
    const savesFromSecondDraftOnward = markSaveLog(saves);

    await releaseAndSettle(page, releaseHeldSave, countAssetRefetches);

    await titleField(page).fill("Second draft");
    await page.getByRole("button", { name: "Save" }).click();
    await expect.poll(() => savesFromSecondDraftOnward().length).toBeGreaterThan(0);

    // the second draft has never been saved, so its saves must be creates.
    // A real objectId here means it adopted the first draft's asset.
    expect(
      savesFromSecondDraftOnward().filter((save) => save.objectId !== "")
    ).toEqual([]);
  });

  test("the second template picked wins even when the first request resolves last", async ({
    page,
  }) => {
    const { saves } = await interceptSaves(page);

    const { promise: heldFirstTemplate, resolve: releaseFirstTemplate } =
      Promise.withResolvers<void>();
    const requestedTemplateIds: string[] = [];
    await page.route("**/assetManager/getTemplate/**", async (route) => {
      const requestedTemplateId = route.request().url().split("/").pop() ?? "";
      requestedTemplateIds.push(requestedTemplateId);
      if (requestedTemplateIds.length === 1) {
        await heldFirstTemplate;
      }
      await route.continue();
    });

    await openAddAssetFromMenu(page);
    await page.getByLabel("Collection").selectOption({ index: 1 });
    const templateSelect = page.getByLabel("Template");
    const continueButton = page.getByRole("button", { name: "Continue" });

    await templateSelect.selectOption({ index: 1 });
    await continueButton.click();
    await expect.poll(() => requestedTemplateIds.length).toBe(1);

    // the picker stays on screen while the first template is in flight, so the
    // user can change their mind and submit again
    await templateSelect.selectOption({ index: 2 });
    await continueButton.click();
    await expect.poll(() => requestedTemplateIds.length).toBe(2);

    const firstTemplateId = requestedTemplateIds[0];
    const secondTemplateId = requestedTemplateIds[1];

    // the stale response must land, and be ignored, before the assertions run
    const staleTemplateLanded = page.waitForResponse((response) =>
      response.url().includes(`getTemplate/${firstTemplateId}`)
    );
    releaseFirstTemplate();
    await staleTemplateLanded;

    await expect(page.getByRole("heading", { name: "Create Asset" })).toBeVisible();
    await titleField(page).fill("Template race asset");
    await page.getByRole("button", { name: "Save" }).click();
    await expect.poll(() => saves.length).toBeGreaterThan(0);

    expect(saves[0].templateId).toBe(secondTemplateId);
  });

  // the save queue is what prevents a duplicate create, and the queue is easy
  // to lose in a refactor of the editor's save path
  test("a second save while a create is in flight updates rather than creating a duplicate", async ({
    page,
  }) => {
    const { saves, releaseHeldSave, countAssetRefetches } = await interceptSaves(page, "");

    await openAddAssetFromMenu(page);
    await startDraft(page);
    await titleField(page).fill("Duplicate check");
    await page.getByRole("button", { name: "Save" }).click();
    await expect.poll(() => saves.length).toBeGreaterThan(0);

    // the Save button disables itself during a save, so the only way to issue a
    // second one mid-create is an upload, which auto-saves without a click
    const fixture = path.join(test.info().project.testDir, "..", "fixtures", "test-image.jpg");
    await page.locator('input[type="file"]').first().setInputFiles(fixture);
    await expect(page.getByText("test-image.jpg")).toBeVisible({ timeout: 15000 });

    await releaseAndSettle(page, releaseHeldSave, countAssetRefetches);
    await page.waitForURL(/\/assetManager\/editAsset\/.+/);

    // inline related-asset editors create their own assets, so only saves
    // carrying this editor's template count
    const editorTemplateId = saves[0].templateId;
    const isCreateFromThisEditor = (save: RecordedSave): boolean =>
      save.objectId === "" && save.templateId === editorTemplateId;
    const creates = saves.filter(isCreateFromThisEditor);
    expect(creates).toHaveLength(1);
  });

  // reopening the same asset is the one case an assetId check cannot tell
  // apart from a stale session
  test("a save in flight does not revert edits made after the same asset is reopened", async ({
    page,
  }) => {
    const { saves, releaseHeldSave, countAssetRefetches } = await interceptSaves(page, ASSET_1_ID);

    await page.goto(`/assetManager/editAsset/${ASSET_1_ID}`);
    await expect(titleField(page)).toHaveValue("Asset 1");
    await titleField(page).fill("Title from the first session");
    await page.getByRole("button", { name: "Save" }).click();
    await expect.poll(() => saves.length).toBeGreaterThan(0);

    // the reopened asset comes back from the server, so the first session's
    // unsaved edit is gone and the field reads its stored title again
    await openAddAssetFromMenu(page);
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/assetManager/editAsset/${ASSET_1_ID}`));
    await expect(titleField(page)).toHaveValue("Asset 1");

    await titleField(page).fill("Title from the second session");
    await releaseAndSettle(page, releaseHeldSave, countAssetRefetches);

    // the first session's response carries the older title, and applying it
    // would discard what the user typed after reopening
    await expect(titleField(page)).toHaveValue("Title from the second session");
  });

  test("an asset load still in flight does not take over the Add Asset page", async ({
    page,
  }) => {
    const { promise: heldLoad, resolve: releaseHeldLoad } =
      Promise.withResolvers<void>();
    let hasHeldLoad = false;
    await page.route(`**/asset/viewAsset/${ASSET_1_ID}/**`, async (route) => {
      if (!hasHeldLoad) {
        hasHeldLoad = true;
        await heldLoad;
      }
      await route.continue();
    });

    // the edit page hangs on its asset fetch, but the app menu stays usable
    await page.goto(`/assetManager/editAsset/${ASSET_1_ID}`);
    await expect(page.getByText("Loading...")).toBeVisible();

    await openAddAssetFromMenu(page);
    await expect(page.getByLabel("Template")).toBeVisible();

    releaseHeldLoad();
    await page.waitForResponse((response) =>
      response.url().includes(`/asset/viewAsset/${ASSET_1_ID}`)
    );
    // leave time for the abandoned load to (wrongly) fetch its template and render
    await page.waitForTimeout(1000);

    // the load belongs to a page the user already left, so the intake form
    // must survive and Asset 1's editor must not appear
    await expect(page.getByLabel("Template")).toBeVisible();
    await expect(page.getByLabel(/title/i)).toHaveCount(0);
  });

  // an abandoned draft's editor can outlive its page: its held create resolves,
  // the create-response exception adopts the new asset into that editor, and a
  // trailing save then writes to the adopted asset. The fencingToken is per
  // editor instance, so it cannot fence an instance that outlived its page.
  test("abandoning a draft mid-create does not leave an editor writing to the created asset", async ({
    page,
  }) => {
    test.fail(
      true,
      "open bug: the abandoned draft's editor adopts and re-saves its created asset"
    );
    test.setTimeout(20_000);

    const { saves, releaseHeldSave, countAssetRefetches } = await interceptSaves(page, "");

    // visit the existing asset first so goBack later is an in-app navigation
    await page.goto(`/assetManager/editAsset/${ASSET_1_ID}`);
    await expect(titleField(page)).toHaveValue("Asset 1");

    await openAddAssetFromMenu(page);
    await startDraft(page);
    await titleField(page).fill("Abandoned draft");
    await page.getByRole("button", { name: "Save" }).click();
    await expect.poll(() => saves.length).toBeGreaterThan(0);

    // abandon the draft while its create is in flight, reopening Asset 1
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/assetManager/editAsset/${ASSET_1_ID}`));
    await expect(titleField(page)).toHaveValue("Asset 1");
    const savesFromAsset1Onward = markSaveLog(saves);

    await releaseAndSettle(page, releaseHeldSave, countAssetRefetches);

    await titleField(page).fill("Asset 1 edited after reopening");
    await page.getByRole("button", { name: "Save" }).click();
    await expect.poll(() => savesFromAsset1Onward().length).toBeGreaterThan(0);

    // the save queue drains on a cooldown, so a save built from another
    // editor's state can trail the user's save by several seconds
    await page.waitForTimeout(6000);

    // the user is on Asset 1, so every save from here must target Asset 1
    expect(
      savesFromAsset1Onward().filter((save) => save.objectId !== ASSET_1_ID)
    ).toEqual([]);
  });

  test("a failed template load stops the Continue spinner so the user can retry", async ({
    page,
  }) => {
    // 404 rather than 500: 404 is non-retryable, so the failure is immediate
    // and a spinner still visible afterwards is stuck for good
    await page.route("**/assetManager/getTemplate/**", (route) =>
      route.fulfill({ status: 404, contentType: "application/json", body: "{}" })
    );

    await openAddAssetFromMenu(page);
    await page.getByLabel("Template").selectOption({ index: 1 });
    await page.getByLabel("Collection").selectOption({ index: 1 });
    const continueButton = page.getByRole("button", { name: "Continue" });
    await continueButton.click();

    await expect(continueButton.locator(".animate-spin")).toBeHidden({
      timeout: 8000,
    });
    // the intake form is still there, so the user can pick again and retry
    await expect(page.getByLabel("Template")).toBeVisible();
  });
});
