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
    const errorNotification = page.getByText("Widget Error");
    await expect(errorNotification).toBeVisible();

    // The error message should be visible
    // (exact text depends on what error the select widget throws)
    await expect(errorNotification).toContainText(/error|Error/i);

    // The title field should still be visible (since it's not broken)
    // This verifies that only the broken widget shows an error, not the whole page
    const titleField = page.getByLabel(/title/i).first();
    await expect(titleField).toBeVisible();
    await expect(titleField).toHaveValue("Broken Template Asset");
  });
});
