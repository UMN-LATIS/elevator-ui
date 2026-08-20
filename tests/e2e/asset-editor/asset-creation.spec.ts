import { test, expect, type Page } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../../setup";

/** Opens the create form on the first template, with no fields filled in. */
async function startBlankDraft(page: Page): Promise<void> {
  await page.goto("/assetManager/addAsset");
  await page.getByLabel("Template").selectOption({ index: 1 });
  await page.getByLabel("Collection").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Continue" }).click();
}

test.describe("Asset Creation", () => {
  test.describe("With Curator Permissions", () => {
    test.beforeEach(async ({ page, request }) => {
      const workerId = test.info().workerIndex.toString();
      await setupWorkerHTTPHeader({ page, workerId });

      // curator has canManageAssets: true
      await refreshDatabase({ request, workerId });
      await loginUser({ request, page, workerId, username: "curator" });

      await page.goto("/");
    });

    test("can access menu, navigate to asset creation, and create a basic asset", async ({
      page,
    }) => {
      const menuToggle = page.getByRole("button", { name: "Toggle main menu" });
      await menuToggle.click();

      const menu = page.locator("#app-menu-navigation");
      await expect(menu).toContainText("Manage Assets");

      const manageAssetsButton = page.getByRole("button", {
        name: "Manage Assets",
      });
      await manageAssetsButton.click();

      const addAssetLink = page.getByText("Add Asset");
      await expect(addAssetLink).toBeVisible();
      await addAssetLink.click();

      await expect(page).toHaveURL(/\/assetManager\/addAsset/);

      const templateSelect = page.getByLabel("Template");
      await expect(templateSelect).toBeVisible();
      await templateSelect.selectOption({ index: 1 });

      const collectionSelect = page.getByLabel("Collection");
      await expect(collectionSelect).toBeVisible();
      await collectionSelect.selectOption({ index: 1 });

      // Continue enables once the template has loaded
      const continueButton = page.getByRole("button", { name: "Continue" });
      await expect(continueButton).toBeEnabled({ timeout: 5000 });
      await continueButton.click();

      await expect(
        page.getByRole("heading", { name: "Create Asset" })
      ).toBeVisible();

      const titleField = page.getByLabel(/title/i).first();
      await titleField.fill("Test Asset Created via E2E");
      await expect(titleField).toHaveValue("Test Asset Created via E2E");

      const saveButton = page.getByRole("button", { name: "Save" });
      await saveButton.click();

      // a successful create moves the page to the new asset's edit URL
      await expect(page).toHaveURL(/\/assetManager\/editAsset\//);
      await expect(page.getByText("Test Asset Created via E2E")).toBeVisible();
    });

    test("shows validation message for missing required fields", async ({
      page,
    }) => {
      await startBlankDraft(page);

      await expect(page.getByText("Missing required:")).toBeVisible();
      const validationText = page
        .locator("text=Missing required:")
        .locator("..");
      await expect(validationText).toContainText("Title");

      const saveButton = page.getByRole("button", { name: "Save" });
      await expect(saveButton).toBeDisabled();
    });

    test("validation message disappears when required fields are filled", async ({
      page,
    }) => {
      await startBlankDraft(page);

      await expect(page.getByText("Missing required:")).toBeVisible();
      const saveButton = page.getByRole("button", { name: "Save" });
      await expect(saveButton).toBeDisabled();

      await page.getByLabel(/title/i).first().fill("Test Asset Title");

      await expect(page.getByText("Missing required:")).not.toBeVisible();
      await expect(saveButton).toBeEnabled();
    });
  });

  test.describe("Without Permissions", () => {
    test.beforeEach(async ({ page, request }) => {
      const workerId = test.info().workerIndex.toString();
      await setupWorkerHTTPHeader({ page, workerId });

      // the plain user has canManageAssets: false
      await refreshDatabase({ request, workerId });
      await loginUser({ request, page, workerId, username: "user" });

      await page.goto("/");
    });

    test("hides asset creation UI for unauthorized users", async ({ page }) => {
      const menuToggle = page.getByRole("button", { name: "Toggle main menu" });
      await menuToggle.click();

      const menu = page.locator("#app-menu-navigation");
      await expect(menu).not.toContainText("Manage Assets");
      await expect(
        page.getByRole("link", { name: "Add Asset" })
      ).not.toBeVisible();
    });
  });
});
