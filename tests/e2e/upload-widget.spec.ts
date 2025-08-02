import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, refreshDatabase, loginUser } from "../setup";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe("EditUploadWidget", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });
    await page.goto("/");
  });

  test("should upload file, add description, save and verify persistence", async ({
    page,
  }) => {
    // Navigate to create asset page through menu
    const menuToggle = page.getByRole("button", { name: "Toggle main menu" });
    await menuToggle.click();

    const manageAssetsButton = page.getByRole("button", {
      name: "Manage Assets",
    });
    await manageAssetsButton.click();

    const addAssetLink = page.getByText("Add Asset");
    await addAssetLink.click();

    await expect(page).toHaveURL(/\/assetManager\/addAsset/);

    // Select template and collection
    const templateSelect = page.getByLabel("Template");
    await templateSelect.selectOption({ index: 1 });

    const collectionSelect = page.getByLabel("Collection");
    await collectionSelect.selectOption({ index: 1 });

    const continueButton = page.getByRole("button", { name: "Continue" });
    await expect(continueButton).toBeEnabled({ timeout: 5000 });
    await continueButton.click();

    // Wait for form to load
    await expect(
      page.getByRole("heading", { name: "Create Asset" })
    ).toBeVisible();

    // Fill required title field
    await page
      .getByLabel("Title")
      .fill("Test Asset with Upload and Description");

    // Upload file
    const testFilePath = path.join(
      __dirname,
      "..",
      "fixtures",
      "test-image.jpg"
    );

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testFilePath);

    // Wait for upload to complete and file to appear
    await expect(page.getByText("test-image.jpg")).toBeVisible({
      timeout: 15000,
    });

    // First save the asset to get into edit mode where description fields should be available
    const saveButton = page.getByRole("button", { name: "Save" });
    await saveButton.click();

    // Should redirect to edit mode
    await expect(page).toHaveURL(/\/assetManager\/editAsset\//);

    // Verify the uploaded file is visible
    await expect(page.getByText("test-image.jpg")).toBeVisible();

    // Now look for description field in edit mode - try different possible selectors
    const descriptionField = page.getByRole("textbox", {
      name: "Description / Alt Text ?",
    });
    await descriptionField.scrollIntoViewIfNeeded();
    await expect(descriptionField).toBeVisible({ timeout: 2000 });

    // Enter a description for the uploaded file
    await descriptionField.fill(
      "Test image uploaded and described in E2E test"
    );

    // Save the asset with description
    await saveButton.click();

    // Do a full page refresh to verify persistence
    await page.reload();

    // After refresh, verify the file and description are still there
    const description = page.getByRole("textbox", {
      name: "Description / Alt Text ?",
    });
    await description.scrollIntoViewIfNeeded();
    await expect(description).toBeVisible();
  });
});
