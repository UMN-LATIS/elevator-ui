import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";

test.describe("Search Input Functionality", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({
      page,
      workerId,
    });

    // refresh the database for this worker
    await refreshDatabase({ request, workerId });

    // Login user via backend
    await loginUser({ request, page, workerId });

    // Navigate to the homepage
    await page.goto("/");
  });

  test("displays search input with correct placeholder", async ({ page }) => {
    const searchInput = page.getByRole("textbox", { name: "Search" }).first();
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute("placeholder", "Search");
  });

  test("allows typing in search input", async ({ page }) => {
    const searchInput = page.getByRole("textbox", { name: "Search" }).first();

    // Type search query
    await searchInput.fill("test query");
    await expect(searchInput).toHaveValue("test query");

    // Clear and type different query
    await searchInput.fill("");
    await searchInput.fill("sample digital");
    await expect(searchInput).toHaveValue("sample digital");
  });

  test("shows clear button when search input has value", async ({ page }) => {
    const searchInput = page.getByRole("textbox", { name: "Search" }).first();

    // Initially no clear button visible
    const clearButton = page.getByRole("button", { name: /clear search/i });
    await expect(clearButton).toBeHidden();

    // Type something and clear button should appear
    await searchInput.fill("test");
    await expect(clearButton).toBeVisible();

    // Click clear button and input should be empty
    await clearButton.click();
    await expect(searchInput).toHaveValue("");
    await expect(clearButton).toBeHidden();
  });

  test("performs search and navigates to results page", async ({ page }) => {
    const searchInput = page.getByRole("textbox", { name: "Search" }).first();

    // Type search query and submit
    await searchInput.fill("test");
    await searchInput.press("Enter");

    // Should navigate to search results page
    await expect(page).toHaveURL(/\/search\//);

    // Should see search results
    const resultsContainer = page
      .locator(".search-results-grid, .search-results-list")
      .first();
    await expect(resultsContainer).toBeVisible();
  });

  test("shows all results if search is empty", async ({ page }) => {
    const searchInput = page.getByRole("textbox", { name: "Search" }).first();

    // Try to submit empty search
    await searchInput.fill("");
    await searchInput.press("Enter");

    // expect that we should be on search page with a list of results
    await expect(page).toHaveURL(/\/search\//);

    // Should see some results displayed
    const resultsContainer = page
      .locator(".search-results-grid, .search-results-list")
      .first();
    await expect(resultsContainer).toBeVisible();
    const searchResults = page.locator(".search-result-card");
    await expect(searchResults).toHaveCount(30);
  });

  test("keyboard shortcuts work correctly", async ({ page }) => {
    // Test Cmd+K (or Ctrl+K on Windows/Linux) to focus search
    const searchInput = page.getByRole("textbox", { name: "Search" }).first();

    // Focus somewhere else first
    await page.locator("body").click();

    // Press Cmd+K (Mac) or Ctrl+K (Windows/Linux)
    // Use Control key for all non-Mac platforms (including Linux CI)
    const userAgent = await page.evaluate(() => navigator.userAgent);
    const isMac = userAgent.includes("Mac");
    const modifier = isMac ? "Meta" : "Control";
    await page.keyboard.press(`${modifier}+KeyK`);

    // Search input should be focused
    await expect(searchInput).toBeFocused();

    // Type something
    await searchInput.fill("keyboard test");
    await expect(searchInput).toHaveValue("keyboard test");

    // Press Escape to blur
    await page.keyboard.press("Escape");

    // Input should no longer be focused (though value remains)
    await expect(searchInput).not.toBeFocused();
    await expect(searchInput).toHaveValue("keyboard test");
  });

  test("advanced search modal opens and closes", async ({ page }) => {
    // Look for advanced search trigger (three dots icon in search bar)
    const advancedSearchTrigger = page
      .locator("button[aria-label*='advanced'], .search-bar button")
      .first();

    await advancedSearchTrigger.click();

    // Advanced search modal should open
    const modal = page.locator(".advanced-search-form");
    await expect(modal).toBeVisible();

    // Close modal (look for close button or backdrop)
    const closeButton = page.locator(
      "button:has-text('Cancel'), button:has-text('Close')"
    );

    const closeButtonExists = await closeButton.first().isVisible();
    if (closeButtonExists) {
      await closeButton.first().click();
    } else {
      // Try pressing Escape or clicking backdrop
      await page.keyboard.press("Escape");
    }

    // Modal should close
    await expect(modal).toBeHidden();
  });
});
