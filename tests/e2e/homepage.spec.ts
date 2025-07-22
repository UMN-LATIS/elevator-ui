import { test, expect } from "@playwright/test";

test.describe("App Rendering - Homepage", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure the app is in a clean state before each test
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("loads homepage with static page content", async ({ page }) => {
    await expect(page).toHaveTitle(/Elevator/);

    // Look for "Home Page" static content or similar homepage indicators
    const homeContent = page.getByRole("heading", {
      name: "Elevator Home Page",
    });
    await expect(homeContent.first()).toContainText("Elevator Home Page", {
      ignoreCase: true,
    });
  });

  test("displays search bar", async ({ page }) => {
    // Search bar should be visible
    const searchInput = page.getByRole("textbox", { name: "Search" }).first();
    await expect(searchInput).toBeVisible();

    // type something into the search input
    await searchInput.fill("test search");
    await expect(searchInput).toHaveValue("test search");
  });

  test("allows menu interaction", async ({ page }) => {
    // Find menu toggle button or clickable menu element
    const menuToggle = page.getByRole("button", { name: "Toggle main menu" });

    // Ensure the menu toggle is visible
    await expect(menuToggle).toBeVisible();
    await menuToggle.click();

    // now check that the menu is open
    const menu = page.locator("#app-menu-navigation");
    await expect(menu).toContainText("defaultinstance");

    // close the menu
    const closeButton = page.getByRole("button", { name: "Close menu" });
    await closeButton.click();
    await expect(menu).not.toBeVisible();
  });

  test("renders responsively across viewports", async ({ page }) => {
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
