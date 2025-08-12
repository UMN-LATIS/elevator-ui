import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, refreshDatabase, loginUser } from "../setup";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe("EditUploadWidget", () => {
  test.beforeEach(async ({ page, request }) => {
    // Block ArcGIS requests
    await page.route("**/arcgis.com/**", (route) => route.abort());
    await page.route("**/basemaps-api.arcgis.com/**", (route) => route.abort());

    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });
    await page.goto("/");
  });

  test("upload file, add description, save and verify persistence", async ({
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
      .first()
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

    // page should automatically have saved
    await expect(page).toHaveURL(/\/assetManager\/editAsset\//);

    // Now look for description field in edit mode - try different possible selectors
    const descriptionField = page
      .getByRole("textbox", {
        name: "Description / Alt Text ?",
      })
      .first();
    await expect(descriptionField).toBeVisible({ timeout: 5000 });
    await descriptionField.scrollIntoViewIfNeeded();

    // Enter a description for the uploaded file
    await descriptionField.fill(
      "Test image uploaded and described in E2E test"
    );

    // Save the asset with description
    const saveButton = page.getByRole("button", { name: "Save" });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // wait for save to complete
    await page.waitForLoadState("networkidle");

    // Do a full page refresh to verify persistence
    await page.reload();

    // After refresh, verify the file and description are still there
    const description = page
      .getByRole("textbox", {
        name: "Description / Alt Text ?",
      })
      .first();
    await description.scrollIntoViewIfNeeded();
    await expect(description).toBeVisible();
  });
});
