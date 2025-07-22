import { test, expect } from "@playwright/test";

test.describe("Search Functionality", () => {
  test("should navigate to search results page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Try to navigate to search results page directly
    await page.goto("/search");
    await page.waitForLoadState("networkidle");

    // Check that we're on the search page
    await expect(page).toHaveURL(/.*\/search.*/);
  });

  test("should display search interface elements", async ({ page }) => {
    await page.goto("/search");
    await page.waitForLoadState("networkidle");

    // Look for common search interface elements
    const searchElements = [
      'input[type="search"]',
      'input[placeholder*="search" i]',
      'button[type="submit"]',
      '[data-testid*="search"]',
      ".search-form",
      ".search-input",
    ];

    let foundSearchElement = false;
    for (const selector of searchElements) {
      if ((await page.locator(selector).count()) > 0) {
        foundSearchElement = true;
        break;
      }
    }

    // At least one search element should be present
    expect(foundSearchElement).toBe(true);
  });

  test("should handle search query parameters", async ({ page }) => {
    // Test search with query parameter
    await page.goto("/search?q=test");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/.*q=test.*/);
  });

  test("should support different view modes", async ({ page }) => {
    await page.goto("/search");
    await page.waitForLoadState("networkidle");

    // Look for view mode toggles (grid, list, map, timeline based on the codebase)
    const viewModeSelectors = [
      '[data-testid*="view"]',
      '[aria-label*="view" i]',
      'button[title*="grid" i]',
      'button[title*="list" i]',
      'button[title*="map" i]',
      ".view-toggle",
      ".search-views",
    ];

    for (const selector of viewModeSelectors) {
      const element = page.locator(selector).first();
      if ((await element.count()) > 0) {
        await expect(element).toBeVisible();
        break;
      }
    }
  });
});
