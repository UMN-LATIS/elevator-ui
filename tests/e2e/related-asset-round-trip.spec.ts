import { test, expect, type Locator, type Page } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";
import {
  NESTED_RECORD_TITLES,
  nestedRecordDescriptionForLevel,
  nestedRecordIdForLevel,
} from "../../mock-server/db/assets";

// The view page opens ten levels inline. Hardcoded rather than imported from
// the component, so changing the limit fails this test instead of moving with
// it.
const DEEPEST_LEVEL_OPENED_INLINE = 10;
const DESCRIPTION_AT_NESTING_LIMIT = nestedRecordDescriptionForLevel(
  DEEPEST_LEVEL_OPENED_INLINE
);
const FIRST_RECORD_SHOWN_AS_LINK =
  NESTED_RECORD_TITLES[DEEPEST_LEVEL_OPENED_INLINE];

// a seeded public asset whose title no other seeded asset shares, so the
// mock's substring search returns exactly one option
const CHILD_TITLE =
  "View of the Mississippi River gorge from the Washington Avenue Bridge " +
  "at sunrise, with fog rising off the water";
const CHILD_SEARCH_TERM = "Mississippi River gorge";

// the pair of assets the cycle test points at each other. Each title is its
// own search term, so it has to match nothing else in the db.
const FIRST_CYCLE_TITLE = "Ouroboros One";
const SECOND_CYCLE_TITLE = "Ouroboros Two";

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
async function chooseRelatedAsset(
  page: Page,
  searchTerm: string = CHILD_SEARCH_TERM
): Promise<void> {
  await page.getByText("Select an asset...").click();

  const search = page.getByPlaceholder("Select Related Assets...");
  await expect(search).toBeVisible();
  await search.fill(searchTerm);

  const option = page.getByRole("option").filter({ hasText: searchTerm });
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

  test("two assets that link to each other stop nesting after one level", async ({
    page,
  }) => {
    // three creates and an edit, each with its own save round trip
    test.setTimeout(60_000);

    await page.goto("/assetManager/addAsset");
    await startAutocompleteDraft(page);
    await page.getByLabel(/title/i).first().fill(FIRST_CYCLE_TITLE);
    const firstAssetId = await saveAndReadAssetId(page);

    await page.goto("/assetManager/addAsset");
    await startAutocompleteDraft(page);
    await page.getByLabel(/title/i).first().fill(SECOND_CYCLE_TITLE);
    await chooseRelatedAsset(page, FIRST_CYCLE_TITLE);
    await saveAndReadAssetId(page);

    await page.goto(`/assetManager/editAsset/${firstAssetId}`);
    await expect(page.getByText("Select an asset...")).toBeVisible();
    await chooseRelatedAsset(page, SECOND_CYCLE_TITLE);
    await page.getByRole("button", { name: "Save" }).click();

    await page.goto(`/asset/viewAsset/${firstAssetId}`);
    const secondAssetOnView = relatedAssetOnView(page).filter({
      hasText: SECOND_CYCLE_TITLE,
    });
    await expect(secondAssetOnView).toHaveCount(1);

    await secondAssetOnView.locator(".accordion__header").click();
    const nestedBody = secondAssetOnView.locator(".accordion__body");
    await expect(nestedBody).toBeVisible();

    // the second asset's own related asset widget points back at the first,
    // which is already rendering above it. It shows as a link instead, so the
    // page keeps the relationship visible while the nesting stops.
    await expect(
      nestedBody.locator(".linked-related-asset-widget-item")
    ).toContainText(FIRST_CYCLE_TITLE);
    await expect(
      nestedBody.locator(".accordion-related-asset-widget-item")
    ).toHaveCount(0);
  });
});

test.describe("related asset widget, nesting limit", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
  });

  test("a chain deeper than the nesting limit switches to links", async ({
    page,
  }) => {
    // one asset and template fetch per level opened
    test.setTimeout(60_000);

    await page.goto(`/asset/viewAsset/${nestedRecordIdForLevel(1)}`);

    // each record holds exactly one child, so opening the first accordion at
    // every level walks straight down the chain. Level 1 is the page itself.
    const accordionsToOpen = DEEPEST_LEVEL_OPENED_INLINE - 1;
    let openRecordBody: Locator = page.locator(".widget-list").first();

    for (let opened = 0; opened < accordionsToOpen; opened++) {
      const childRecord = openRecordBody
        .locator(".accordion-related-asset-widget-item")
        .first();
      await expect(childRecord).toBeVisible();
      await childRecord.locator(".accordion__header").first().click();

      openRecordBody = childRecord.locator(".accordion__body").first();
      await expect(openRecordBody).toBeVisible();
    }

    await expect(openRecordBody).toContainText(DESCRIPTION_AT_NESTING_LIMIT);

    const linkedRecord = openRecordBody.locator(
      ".linked-related-asset-widget-item"
    );
    await expect(linkedRecord).toContainText(FIRST_RECORD_SHOWN_AS_LINK);
    await expect(linkedRecord.getByRole("link")).toHaveAttribute(
      "href",
      new RegExp(`${nestedRecordIdForLevel(DEEPEST_LEVEL_OPENED_INLINE + 1)}$`)
    );
    await expect(
      openRecordBody.locator(".accordion-related-asset-widget-item")
    ).toHaveCount(0);
  });
});
