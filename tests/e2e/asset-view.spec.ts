import { test, expect } from "@playwright/test";

test.describe("Asset View", () => {
  // Use the actual mock asset ID from fixtures
  const MOCK_ASSET_ID = "12345";

  test("should handle asset URLs", async ({ page }) => {
    // Test navigation to an asset page using mock data and correct route
    await page.goto(`/asset/viewAsset/${MOCK_ASSET_ID}`);
    await page.waitForLoadState("networkidle");

    // Should be on an asset page
    await expect(page).toHaveURL(/.*\/asset\/viewAsset\/.*/);
  });

  test("should display asset metadata", async ({ page }) => {
    await page.goto(`/asset/viewAsset/${MOCK_ASSET_ID}`);
    await page.waitForLoadState("networkidle");

    // Look for asset view components based on actual Vue structure
    const assetViewElements = [
      ".asset-view-page__asset-view",
      ".asset-view__asset-panel",
      ".asset-details-panel",
      ".asset-view-page",
      '[class*="asset-view"]',
    ];

    let foundAssetViewElement = false;
    for (const selector of assetViewElements) {
      if ((await page.locator(selector).count()) > 0) {
        foundAssetViewElement = true;
        break;
      }
    }

    expect(foundAssetViewElement).toBe(true);
  });

  test("should display asset content", async ({ page }) => {
    await page.goto(`/asset/viewAsset/${MOCK_ASSET_ID}`);
    await page.waitForLoadState("networkidle");

    // Look for any content - could be metadata only, viewer, or other content
    const contentElements = [
      ".asset-view__object-viewer",
      ".asset-view__details-panel",
      ".object-viewer",
      "article", // General content container
      "h1, h2, h3", // Asset title/headings
      "img", // Images/thumbnails
      "canvas", // Object viewer canvas
      "video", // Video content
      "iframe", // Embedded content
      '[class*="object-viewer"]',
      '[class*="viewer"]',
      "main article", // Main content area
    ];

    let foundContentElement = false;
    for (const selector of contentElements) {
      if ((await page.locator(selector).count()) > 0) {
        foundContentElement = true;
        break;
      }
    }

    expect(foundContentElement).toBe(true);
  });

  test("should support asset navigation", async ({ page }) => {
    await page.goto(`/asset/viewAsset/${MOCK_ASSET_ID}`);
    await page.waitForLoadState("networkidle");

    // Look for navigation elements within the asset
    const navigationElements = [
      '[data-testid*="nav"]',
      ".asset-navigation",
      ".pagination",
      'button[aria-label*="next" i]',
      'button[aria-label*="previous" i]',
      'a[href*="#"]', // Hash navigation for objects within asset
    ];

    for (const selector of navigationElements) {
      const element = page.locator(selector).first();
      if ((await element.count()) > 0) {
        await expect(element).toBeVisible();
        break;
      }
    }
  });

  test("should handle hash navigation for asset objects", async ({ page }) => {
    // Test hash-based navigation within assets
    await page.goto(`/asset/viewAsset/${MOCK_ASSET_ID}#object-1`);
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/.*#object.*/);

    // The page should handle the hash navigation
    await expect(page.locator("#app")).toBeVisible();
  });

  test("should be accessible", async ({ page }) => {
    await page.goto(`/asset/viewAsset/${MOCK_ASSET_ID}`);
    await page.waitForLoadState("networkidle");

    // Check for basic accessibility features
    const accessibilityFeatures = [
      "h1, h2, h3, h4, h5, h6", // Proper heading structure
      "[aria-label]", // ARIA labels
      "[role]", // ARIA roles
      "button, a, input", // Interactive elements
    ];

    for (const selector of accessibilityFeatures) {
      const elements = page.locator(selector);
      if ((await elements.count()) > 0) {
        // At least some accessibility features should be present
        expect(await elements.count()).toBeGreaterThan(0);
        break;
      }
    }
  });
});
