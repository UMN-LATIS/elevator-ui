import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";

test.describe("Error Boundary", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });

    // Refresh database and login as curator (has canManageAssets: true)
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });

    await page.goto("/");
  });

  test("shows error message instead of crashing when template has misconfigured widget", async ({
    page,
  }) => {
    // Navigate to edit the asset with the broken template
    // The broken template has a select widget missing `selectGroup` in fieldData
    const brokenAssetId = "broken_template_asset_001";
    await page.goto(`/assetManager/editAsset/${brokenAssetId}`);

    // The page should not crash - we should see some content
    // The error boundary should catch the error and display it
    await expect(page.locator("body")).not.toBeEmpty();

    // Should see an error notification about the misconfigured widget
    // The ErrorBoundary default fallback shows error messages in a Notification component
    const errorNotification = page.locator(".notification--error");
    await expect(errorNotification).toBeVisible({ timeout: 10000 });

    // The error message should be visible
    // (exact text depends on what error the select widget throws)
    await expect(errorNotification).toContainText(/error|Error/i);

    // The title field should still be visible (since it's not broken)
    // This verifies that only the broken widget shows an error, not the whole page
    const titleField = page.getByLabel(/title/i).first();
    await expect(titleField).toBeVisible();
    await expect(titleField).toHaveValue("Broken Template Asset");
  });

  test("keeps header navigation functional when page content errors", async ({
    page,
  }) => {
    // Navigate to the broken asset
    const brokenAssetId = "broken_template_asset_001";
    await page.goto(`/assetManager/editAsset/${brokenAssetId}`);

    // Wait for page to load (even with errors)
    await expect(page.locator("body")).not.toBeEmpty();

    // The main menu should still be accessible
    const menuToggle = page.getByRole("button", { name: "Toggle main menu" });
    await expect(menuToggle).toBeVisible();

    // Should be able to open the menu
    await menuToggle.click();

    const menu = page.locator("#app-menu-navigation");
    await expect(menu).toBeVisible();

    // Should be able to navigate away from the broken page
    const homeLink = page.getByRole("link", { name: /home/i });
    await homeLink.click();

    // Should successfully navigate to home
    await expect(page).toHaveURL("/");
  });

  test("error notification can be dismissed", async ({ page }) => {
    const brokenAssetId = "broken_template_asset_001";
    await page.goto(`/assetManager/editAsset/${brokenAssetId}`);

    // Wait for error notification to appear
    const errorNotification = page.locator(".notification--error");
    await expect(errorNotification).toBeVisible({ timeout: 10000 });

    // Find and click the dismiss button (the X button in the notification)
    const dismissButton = errorNotification.locator("button");
    await expect(dismissButton).toBeVisible();
    await dismissButton.click();

    // Error notification should be dismissed
    await expect(errorNotification).not.toBeVisible();
  });
});
