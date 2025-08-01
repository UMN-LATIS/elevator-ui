import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";

test.describe("Asset Editing", () => {
  test.describe("With Curator Permissions", () => {
    test.beforeEach(async ({ page, request }) => {
      const workerId = test.info().workerIndex.toString();
      await setupWorkerHTTPHeader({ page, workerId });

      // Refresh database and login as curator (has canManageAssets: true)
      await refreshDatabase({ request, workerId });
      await loginUser({ request, page, workerId, username: "curator" });

      await page.goto("/");
    });

    test("can edit an existing asset", async ({ page }) => {
      // Navigate to edit existing asset via URL (Asset 1 from mock data)
      const assetId = "6875871d4eb080a4880a0f44";
      await page.goto(`/assetManager/editAsset/${assetId}`);

      // Should navigate to asset edit page
      await expect(page).toHaveURL(
        new RegExp(`/assetManager/editAsset/${assetId}`)
      );

      // Should see the edit form populated with existing data
      const titleField = page.getByLabel(/title/i).first();
      await expect(titleField).toBeVisible();
      await expect(titleField).toHaveValue("Asset 1");

      // Edit the title
      await titleField.fill("Asset 1 - Edited via E2E");

      // Save the changes
      const saveButton = page.getByRole("button", { name: "Save" });
      await expect(saveButton).toBeEnabled();
      await saveButton.click();

      // Should remain on edit page after save
      await expect(page).toHaveURL(
        new RegExp(`/assetManager/editAsset/${assetId}`)
      );

      // Should show the updated title
      await expect(titleField).toHaveValue("Asset 1 - Edited via E2E");

      // verify the changes persist - reload the page
      await page.reload();
      await expect(titleField).toHaveValue("Asset 1 - Edited via E2E");
    });

    test("menu shows asset management options when editing", async ({
      page,
    }) => {
      const assetId = "6875871d4eb080a4880a0f44";
      await page.goto(`/assetManager/editAsset/${assetId}`);

      // Open menu
      const menuToggle = page.getByRole("button", { name: "Toggle main menu" });
      await menuToggle.click();

      // Should see "Manage Assets" section for users with permissions
      const menu = page.locator("#app-menu-navigation");
      await expect(menu).toContainText("Manage Assets");

      // Expand "Manage Assets" section
      const manageAssetsButton = page.getByRole("button", {
        name: "Manage Assets",
      });
      await manageAssetsButton.click();

      // Should see asset management options (exact options depend on context)
      // Just verify the section expands and shows some content
      await expect(menu).toBeVisible();
    });

    test("shows no unsaved changes message when editing without modifications", async ({
      page,
    }) => {
      const assetId = "6875871d4eb080a4880a0f44";
      await page.goto(`/assetManager/editAsset/${assetId}`);

      // Wait for asset to load
      const titleField = page.getByLabel(/title/i).first();
      await expect(titleField).toHaveValue("Asset 1");

      // Should show "No unsaved changes" message
      await expect(page.getByText("No unsaved changes")).toBeVisible();

      // Save button should be disabled
      const saveButton = page.getByRole("button", { name: "Save" });
      await expect(saveButton).toBeDisabled();
    });

    test("shows validation message when required fields are cleared during editing", async ({
      page,
    }) => {
      const assetId = "6875871d4eb080a4880a0f44";
      await page.goto(`/assetManager/editAsset/${assetId}`);

      // Wait for asset to load
      const titleField = page.getByLabel(/title/i).first();
      await expect(titleField).toHaveValue("Asset 1");

      // Initially should show "No unsaved changes"
      await expect(page.getByText("No unsaved changes")).toBeVisible();
      const saveButton = page.getByRole("button", { name: "Save" });
      await expect(saveButton).toBeDisabled();

      // Clear the required title field
      await titleField.clear();

      // Should now show validation message
      await expect(page.getByText("Missing required:")).toBeVisible();
      const validationText = page
        .locator("text=Missing required:")
        .locator("..");
      await expect(validationText).toContainText("Title");

      // Save button should still be disabled
      await expect(saveButton).toBeDisabled();

      // "No unsaved changes" message should be hidden
      await expect(page.getByText("No unsaved changes")).not.toBeVisible();
    });

    test("validation message disappears when required fields are filled during editing", async ({
      page,
    }) => {
      const assetId = "6875871d4eb080a4880a0f44";
      await page.goto(`/assetManager/editAsset/${assetId}`);

      // Wait for asset to load
      const titleField = page.getByLabel(/title/i).first();
      await expect(titleField).toHaveValue("Asset 1");

      // Clear the required title field to trigger validation
      await titleField.clear();

      // Should show validation message
      await expect(page.getByText("Missing required:")).toBeVisible();
      const saveButton = page.getByRole("button", { name: "Save" });
      await expect(saveButton).toBeDisabled();

      // Fill in the title field with new content
      await titleField.fill("Asset 1 - Modified Title");

      // Validation message should disappear
      await expect(page.getByText("Missing required:")).not.toBeVisible();

      // Save button should be enabled since we have unsaved changes and valid form
      await expect(saveButton).toBeEnabled();

      // Should not show "No unsaved changes" since we modified the field
      await expect(page.getByText("No unsaved changes")).not.toBeVisible();
    });
  });

  test.describe("Without Permissions", () => {
    test.beforeEach(async ({ page, request }) => {
      const workerId = test.info().workerIndex.toString();
      await setupWorkerHTTPHeader({ page, workerId });

      // Login as regular user (no canManageAssets permission)
      await refreshDatabase({ request, workerId });
      await loginUser({ request, page, workerId, username: "user" });

      await page.goto("/");
    });

    test("hides edit buttons for unauthorized users", async ({ page }) => {
      // Navigate to an asset view page
      const assetId = "6875871d4eb080a4880a0f44";
      await page.goto(`/assetManager/asset/${assetId}`);

      // Should NOT see edit button in asset details
      const editButton = page.getByRole("button", { name: /edit/i });
      await expect(editButton).not.toBeVisible();

      // Open menu to verify no edit options
      const menuToggle = page.getByRole("button", { name: "Toggle main menu" });
      await menuToggle.click();

      const menu = page.locator("#app-menu-navigation");
      // Should NOT see "Manage Assets" section at all
      await expect(menu).not.toContainText("Manage Assets");
    });

    test.skip("should not allow direct access to asset editing page", () => {
      // TODO: Users without canManageAssets permission should not be able to directly access edit pages
      // Expected behavior:
      // - Should redirect to 403 access denied page
      // - OR show "Access Denied" message on the page
      // - OR redirect to home page with error message
    });
  });

  test.describe("Unauthenticated Access", () => {
    test.beforeEach(async ({ page, request }) => {
      const workerId = test.info().workerIndex.toString();
      await setupWorkerHTTPHeader({ page, workerId });

      // Refresh database but DON'T login - test unauthenticated access
      await refreshDatabase({ request, workerId });
    });

    test.skip("should not allow direct access to asset editing page", () => {
      // TODO: Unauthenticated users should not be able to directly access edit pages
      // Expected behavior:
      // - Should redirect to login/authentication page
      // - OR show "Please log in" message
      // - Should NOT allow access to asset editing functionality
    });
  });
});
