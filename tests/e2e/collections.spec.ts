import { test, expect } from "@playwright/test";

test.describe("Collections", () => {
  test("should navigate to all collections page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Navigate to collections page
    await page.goto("/collections");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/.*\/collections.*/);
  });

  test("should display collections interface", async ({ page }) => {
    await page.goto("/collections");
    await page.waitForLoadState("networkidle");

    // Look for collections-related elements
    const collectionsElements = [
      '[data-testid*="collection"]',
      ".collection-grid",
      ".collection-list",
      ".collections-container",
      "h1, h2, h3", // Page heading
    ];

    let foundCollectionElement = false;
    for (const selector of collectionsElements) {
      if ((await page.locator(selector).count()) > 0) {
        foundCollectionElement = true;
        break;
      }
    }

    expect(foundCollectionElement).toBe(true);
  });

  test("should navigate to drawers page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Navigate to drawers (user collections) page
    await page.goto("/drawers");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/.*\/drawers.*/);
  });

  test("should display drawer interface", async ({ page }) => {
    await page.goto("/drawers");
    await page.waitForLoadState("networkidle");

    // Look for drawer-related elements
    const drawerElements = [
      '[data-testid*="drawer"]',
      ".drawer-grid",
      ".drawer-list",
      ".drawers-container",
      "h1, h2, h3", // Page heading
    ];

    let foundDrawerElement = false;
    for (const selector of drawerElements) {
      if ((await page.locator(selector).count()) > 0) {
        foundDrawerElement = true;
        break;
      }
    }

    expect(foundDrawerElement).toBe(true);
  });

  test("should handle collection browsing", async ({ page }) => {
    await page.goto("/collections");
    await page.waitForLoadState("networkidle");

    // Look for clickable collection items
    const collectionLinks = page
      .locator(
        'a[href*="/collection/"], [data-testid*="collection-link"], .collection-item a'
      )
      .first();

    if ((await collectionLinks.count()) > 0) {
      // Click on first collection if available
      await collectionLinks.click();
      await page.waitForLoadState("networkidle");

      // Should navigate to a collection browse page
      await expect(page).toHaveURL(/.*\/collection\/.*/);
    }
  });
});
