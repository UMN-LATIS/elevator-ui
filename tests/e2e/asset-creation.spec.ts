import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";

test.describe("Asset Creation", () => {
  test.describe("With Curator Permissions", () => {
    test.beforeEach(async ({ page, request }) => {
      const workerId = test.info().workerIndex.toString();
      await setupWorkerHTTPHeader({ page, workerId });

      // Refresh database and login as curator (has canManageAssets: true)
      await refreshDatabase({ request, workerId });
      await loginUser({ request, page, workerId, username: "curator" });

      await page.goto("/");
    });

    test("can access menu, navigate to asset creation, and create a basic asset", async ({
      page,
    }) => {
      // Test menu access and navigation
      const menuToggle = page.getByRole("button", { name: "Toggle main menu" });
      await menuToggle.click();

      const menu = page.locator("#app-menu-navigation");
      await expect(menu).toContainText("Manage Assets");

      // Expand "Manage Assets" section and click "Add Asset"
      const manageAssetsButton = page.getByRole("button", {
        name: "Manage Assets",
      });
      await manageAssetsButton.click();

      const addAssetLink = page.getByText("Add Asset");
      await expect(addAssetLink).toBeVisible();
      await addAssetLink.click();

      // Should navigate to asset creation page
      await expect(page).toHaveURL(/\/assetManager\/addAsset/);

      // Test template and collection selection
      const templateSelect = page.getByLabel("Template");
      await expect(templateSelect).toBeVisible();
      await templateSelect.selectOption({ index: 1 });

      const collectionSelect = page.getByLabel("Collection");
      await expect(collectionSelect).toBeVisible();
      await collectionSelect.selectOption({ index: 1 });

      // Continue to asset form
      const continueButton = page.getByRole("button", { name: "Continue" });
      await expect(continueButton).toBeEnabled();
      await continueButton.click();

      // expect to see the Create Asset form
      await page.getByRole("heading", { name: "Create Asset" }).isVisible();

      // Fill in required title field and save
      const titleField = page.getByLabel(/title/i).first();
      await titleField.fill("Test Asset Created via E2E");
      // expect title field to be filled
      await expect(titleField).toHaveValue("Test Asset Created via E2E");

      const saveButton = page.getByRole("button", { name: "Save" });
      await saveButton.click();

      // Should redirect to edit mode
      await expect(page).toHaveURL(/\/assetManager\/editAsset\//);

      // Should show the created asset
      const assetTitle = page.getByText("Test Asset Created via E2E");
      await expect(assetTitle).toBeVisible();
    });

    test("save is disabled if missing required fields", async ({ page }) => {
      await page.goto("/assetManager/addAsset");

      // Select template and collection
      const templateSelect = page.getByLabel("Template");
      await templateSelect.selectOption({ index: 1 });

      const collectionSelect = page.getByLabel("Collection");
      await collectionSelect.selectOption({ index: 1 });

      // Click Continue to go to the asset form
      const continueButton = page.getByRole("button", { name: "Continue" });
      await continueButton.click();

      // Try to save without filling required title field
      const saveButton = page.getByRole("button", { name: "Save" });
      await expect(saveButton).toBeDisabled();

      // Check for validation message or indicator when save is disabled
      const validationMessage = page.getByText("Please fill out all required fields.");
      await expect(validationMessage).toBeVisible();
    });
  });

  test.describe("Without Permissions", () => {
    test.beforeEach(async ({ page, request }) => {
      const workerId = test.info().workerIndex.toString();
      await setupWorkerHTTPHeader({ page, workerId });

      // Refresh database and login as regular user (canManageAssets: false)
      await refreshDatabase({ request, workerId });
      await loginUser({ request, page, workerId, username: "user" });

      await page.goto("/");
    });

    test("hides asset creation UI for unauthorized users", async ({ page }) => {
      // Open menu
      const menuToggle = page.getByRole("button", { name: "Toggle main menu" });
      await menuToggle.click();

      const menu = page.locator("#app-menu-navigation");

      // Should NOT see "Manage Assets" section
      await expect(menu).not.toContainText("Manage Assets");

      // Should NOT see "Add Asset" link
      const addAssetLink = page.getByRole("link", { name: "Add Asset" });
      await expect(addAssetLink).not.toBeVisible();

      // Close menu
      const closeButton = page.getByRole("button", { name: "Close menu" });
      await closeButton.click();
    });
  });
});
