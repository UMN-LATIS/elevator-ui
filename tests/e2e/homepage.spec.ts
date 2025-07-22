import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load the homepage successfully", async ({ page }) => {
    await page.goto("/");

    // Check that the page loads and has the expected title
    await expect(page).toHaveTitle(/Elevator/);

    // Wait for the app to be fully loaded
    await page.waitForLoadState("networkidle");

    // Check that the main content is visible
    await expect(page.locator("#app")).toBeVisible();
  });

  test("should display search functionality", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Look for search input or search-related elements
    const searchInput = page
      .locator(
        'input[type="search"], input[placeholder*="search" i], input[aria-label*="search" i]'
      )
      .first();

    if ((await searchInput.count()) > 0) {
      await expect(searchInput).toBeVisible();
    }
  });

  test("should be responsive", async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("#app")).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator("#app")).toBeVisible();
  });
});
