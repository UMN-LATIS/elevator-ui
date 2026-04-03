import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";

test.describe("Click-to-Search Cascade Select Filter (#495)", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });
  });

  test("field-specific click-to-search populates advanced filter cascade dropdowns", async ({
    page,
  }) => {
    // Pre-seeded "All Fields Asset" from mock-server/db/assets.ts
    // Has cascade select data: { country: "usa", stateorprovince: "minnesota", city: "St. Paul", neighborhood: "Summit Hill" }
    const existingAssetId = "687969fd9c90c709c1021d01";
    await page.goto(`/asset/viewAsset/${existingAssetId}`);
    await page.waitForLoadState("networkidle");

    // The cascade select widget (fieldTitle: cascadeselect_1, clickToSearchType: 1)
    // renders values as clickable links: usa : minnesota : St. Paul : Summit Hill
    // Click "minnesota" which should trigger a scoped search for "usa : minnesota"
    const minnesotaLink = page.getByRole("link", { name: "minnesota" });
    await expect(minnesotaLink).toBeVisible();
    await minnesotaLink.click();

    // Should navigate to search results page
    await expect(page).toHaveURL(/\/search\/s\//);

    // Open the advanced search panel. When filters are active, the
    // "Advanced Search" button is replaced by a filter-count button.
    const advancedSearchTrigger = page.getByRole("button", {
      name: /advanced|\d+\s+filters?/i,
    });

    const advancedForm = page.locator(".advanced-search-form");
    if (!(await advancedForm.isVisible())) {
      await advancedSearchTrigger.click();
      await expect(advancedForm).toBeVisible();
    }

    // The cascade select field should be selected in the filter row
    const filterFieldSelect = advancedForm.locator(
      "select.filter-row__name"
    );
    await expect(filterFieldSelect).toBeVisible();
    await expect(filterFieldSelect).toHaveValue("cascadeselect_1");

    // Verify the cascade select dropdowns are populated with correct values
    // The clicked value was "minnesota" which sends "usa : minnesota" as the search text
    // After normalization, the dropdowns should show: country=usa, State or Province=minnesota
    const cascadeSelect = advancedForm.locator(".cascade-select");
    await expect(cascadeSelect).toBeVisible();

    // The cascade dropdowns render with sr-only labels, so locate by role
    const cascadeDropdowns = cascadeSelect.locator("select");

    // First dropdown (Country) should have "usa" selected
    await expect(cascadeDropdowns.nth(0)).toHaveValue("usa");

    // Second dropdown (State or Province) should have "minnesota" selected
    await expect(cascadeDropdowns.nth(1)).toHaveValue("minnesota");
  });
});
