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
    // Navigate to the pre-seeded "All Fields Asset" which has cascade select data:
    // { country: "usa", stateorprovince: "minnesota", city: "St. Paul", neighborhood: "Summit Hill" }
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

    // Open the advanced search panel
    const advancedSearchTrigger = page.getByRole("button", {
      name: /advanced/i,
    });

    // The filter badge or advanced search should indicate a filter is active
    // Open the advanced search form to inspect the filter
    const advancedForm = page.locator(".advanced-search-form");
    if (!(await advancedForm.isVisible())) {
      await advancedSearchTrigger.click();
      await expect(advancedForm).toBeVisible();
    }

    // The cascade select field should be selected in the filter row
    const filterFieldSelect = advancedForm.locator(
      ".filter-row__name"
    );
    await expect(filterFieldSelect).toBeVisible();

    // Verify the cascade select dropdowns are populated with correct values
    // The clicked value was "minnesota" which sends "usa : minnesota" as the search text
    // After normalization, the dropdowns should show: country=usa, State or Province=minnesota
    const cascadeSelect = advancedForm.locator(".cascade-select");
    await expect(cascadeSelect).toBeVisible();

    // First dropdown (Country) should have "usa" selected
    const countrySelect = cascadeSelect.getByLabel("country");
    await expect(countrySelect).toBeVisible();
    await expect(countrySelect).toHaveValue("usa");

    // Second dropdown (State or Province) should have "minnesota" selected
    const stateSelect = cascadeSelect.getByLabel("State or Province");
    await expect(stateSelect).toBeVisible();
    await expect(stateSelect).toHaveValue("minnesota");
  });
});
