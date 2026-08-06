import { test, expect, type Page } from "@playwright/test";
import {
  setupWorkerHTTPHeader,
  loginUser,
  refreshDatabase,
  getAssetCount,
} from "../setup";

const SAVE_ROUTE = "**/assetManager/submission/**";

// A create sends an empty objectId, so a non-empty one names an asset that
// already exists.
type RecordedSave = { objectId: string };

/**
 * Records every save and holds the first create open, so the test can confirm
 * a template change while that create is still in flight.
 */
async function holdFirstCreate(page: Page): Promise<{
  saves: RecordedSave[];
  releaseCreate: () => void;
  countSettledSaves: () => number;
}> {
  const saves: RecordedSave[] = [];
  let isHolding = false;
  let settledSaveCount = 0;
  const { promise: heldCreate, resolve: releaseCreate } =
    Promise.withResolvers<void>();

  // counting responses, not requests: the asset count is only meaningful once
  // the server has finished writing every save the editor sent
  page.on("response", (response) => {
    if (response.url().includes("assetManager/submission")) {
      settledSaveCount += 1;
    }
  });

  await page.route(SAVE_ROUTE, async (route) => {
    const body = route.request().postData() ?? "";
    const objectId = body.match(/"objectId":"([^"]*)"/)?.[1] ?? "";
    saves.push({ objectId });

    if (!isHolding && objectId === "") {
      isHolding = true;
      await heldCreate;
    }
    await route.continue();
  });

  return { saves, releaseCreate, countSettledSaves: () => settledSaveCount };
}

test.describe("changing the template while a create is in flight", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });
  });

  test("creates one asset, not two", async ({ page, request }) => {
    test.setTimeout(45_000);
    const workerId = test.info().workerIndex.toString();
    const initialAssetCount = await getAssetCount({ request, workerId });
    const { saves, releaseCreate, countSettledSaves } =
      await holdFirstCreate(page);

    await page.goto("/assetManager/addAsset");
    await page.getByLabel("Template").selectOption({ label: "Some Fields" });
    await page.getByLabel("Collection").selectOption({ index: 1 });
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(
      page.getByRole("heading", { name: "Create Asset" })
    ).toBeVisible();

    await page
      .getByLabel(/title/i)
      .first()
      .fill("Asset that must exist once");

    // the create is now held open by the route, so everything below happens
    // while the editor is waiting for its new assetId
    await page.getByRole("button", { name: "Save" }).click();
    await expect.poll(() => saves.length).toBe(1);

    await page
      .getByLabel("Template")
      .selectOption({ label: "All Fields Test" });
    const confirmDialog = page.getByRole("dialog", { name: "Are you sure?" });
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole("button", { name: "Confirm" }).click();

    releaseCreate();

    // the migration's own save follows the create. It must update the asset
    // the create made rather than making a second one.
    await expect
      .poll(countSettledSaves, { timeout: 20_000 })
      .toBeGreaterThan(1);

    expect(await getAssetCount({ request, workerId })).toBe(
      initialAssetCount + 1
    );
    expect(saves[saves.length - 1].objectId).toMatch(/^[0-9a-f-]{24,36}$/);
    await expect(page).toHaveURL(/editAsset/);
  });
});
