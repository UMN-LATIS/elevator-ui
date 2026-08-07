import { test, expect, type Locator, type Page } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";

// a seeded public asset whose title no other seeded asset shares, so the
// mock's substring search returns exactly one option
const CHILD_TITLE =
  "View of the Mississippi River gorge from the Washington Avenue Bridge " +
  "at sunrise, with fog rising off the water";
const CHILD_SEARCH_TERM = "Mississippi River gorge";

/** Starts a draft on the template whose related asset widget is searchable. */
async function startAutocompleteDraft(page: Page): Promise<void> {
  await page
    .getByLabel("Template")
    .selectOption({ label: "All Fields with Autocomplete" });
  await page.getByLabel("Collection").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByLabel(/title/i).first()).toBeVisible();
}

/** Searches the related asset combobox and picks the one match. */
async function chooseRelatedAsset(page: Page): Promise<void> {
  await page.getByText("Select an asset...").click();

  const search = page.getByPlaceholder("Select Related Assets...");
  await expect(search).toBeVisible();
  await search.fill(CHILD_SEARCH_TERM);

  const option = page.getByRole("option").filter({ hasText: CHILD_SEARCH_TERM });
  await expect(option).toBeVisible({ timeout: 10000 });
  await option.click();
}

/** Saves and returns the asset id the editor lands on. */
async function saveAndReadAssetId(page: Page): Promise<string> {
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL(/\/assetManager\/editAsset\/.+/);
  const assetId = page.url().match(/editAsset\/([^/?#]+)/)?.[1] ?? "";
  expect(assetId).not.toBe("");
  return assetId;
}

function relatedAssetOnView(page: Page): Locator {
  return page.locator(".accordion-related-asset-widget-item");
}

test.describe("related asset widget, editor to view page", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });
  });

  test("an asset picked in the editor renders on the view page", async ({
    page,
  }) => {
    test.setTimeout(30_000);

    await page.goto("/assetManager/addAsset");
    await startAutocompleteDraft(page);
    await page.getByLabel(/title/i).first().fill("Parent with a related asset");
    await chooseRelatedAsset(page);

    const assetId = await saveAndReadAssetId(page);
    await page.goto(`/asset/viewAsset/${assetId}`);

    // the view page reads the target's title out of the saved asset's
    // relatedAssetCache, so a link saved without one renders nothing at all
    await expect(relatedAssetOnView(page)).toContainText(CHILD_TITLE);
  });

  test("clearing the related asset drops it from the view page", async ({
    page,
  }) => {
    test.setTimeout(30_000);

    await page.goto("/assetManager/addAsset");
    await startAutocompleteDraft(page);
    await page.getByLabel(/title/i).first().fill("Parent losing its link");
    await chooseRelatedAsset(page);

    const assetId = await saveAndReadAssetId(page);
    await page.goto(`/asset/viewAsset/${assetId}`);
    await expect(relatedAssetOnView(page)).toContainText(CHILD_TITLE);

    await page.goto(`/assetManager/editAsset/${assetId}`);
    await page.getByRole("button", { name: "Clear" }).click();
    await expect(page.getByText("Select an asset...")).toBeVisible();

    await page.getByRole("button", { name: "Save" }).click();
    await page.goto(`/asset/viewAsset/${assetId}`);

    await expect(relatedAssetOnView(page)).toHaveCount(0);
  });
});
