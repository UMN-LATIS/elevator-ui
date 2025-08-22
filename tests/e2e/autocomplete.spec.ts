import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";

test.describe("Autocomplete Functionality", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });

    // Refresh database and login as curator
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });

    await page.goto("/");
  });

  test("autocomplete works for text fields in All Fields with Autocomplete template", async ({
    page,
  }) => {
    // Navigate to Add Asset page
    const menuToggle = page.getByRole("button", { name: "Toggle main menu" });
    await menuToggle.click();

    const manageAssetsButton = page.getByRole("button", {
      name: "Manage Assets",
    });
    await manageAssetsButton.click();

    const addAssetLink = page.getByText("Add Asset");
    await addAssetLink.click();

    await expect(page).toHaveURL(/\/assetManager\/addAsset/);

    // Select "All Fields with Autocomplete" template
    const templateSelect = page.getByLabel("Template");
    await templateSelect.selectOption({ label: "All Fields with Autocomplete" });

    // Select Default Collection
    const collectionSelect = page.getByLabel("Collection");
    await collectionSelect.selectOption({ label: "Default Collection" });

    // Continue to asset form
    const continueButton = page.getByRole("button", { name: "Continue" });
    await expect(continueButton).toBeEnabled({ timeout: 5000 });
    await continueButton.click();

    // Should see the Create Asset form
    await expect(page.getByRole("heading", { name: "Create Asset" })).toBeVisible();

    const titleField = page.getByLabel(/title/i).first();

    // Initially there should be no autocomplete open
    await expect(page.getByRole("listbox")).not.toBeVisible();

    // Select the title input - still no autocomplete should be open
    await titleField.click();
    await expect(page.getByRole("listbox")).not.toBeVisible();

    // Type "tes" and should see autocomplete options
    await titleField.fill("tes");
    
    // Wait for autocomplete suggestions to appear
    await expect(page.getByRole("listbox")).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole("option", { name: "test 3", exact: true })).toBeVisible();

    // Select "test 3" option (exact match)
    await page.getByRole("option", { name: "test 3", exact: true }).click();

    // Should see "Test 3" in the input (case may vary based on implementation)
    await expect(titleField).toHaveValue(/test 3/i);

    // Save the asset
    const saveButton = page.getByRole("button", { name: "Save" });
    await saveButton.click();

    // Should redirect to edit mode
    await expect(page).toHaveURL(/\/assetManager\/editAsset\//);

    // Reload the page to test persistence
    await page.reload();

    // "Test 3" should persist after reload
    const titleFieldAfterReload = page.getByLabel(/title/i).first();
    await expect(titleFieldAfterReload).toHaveValue(/test 3/i);

    // Select the title input again and change to "New Option"
    await titleFieldAfterReload.click();
    await titleFieldAfterReload.fill("New Option");

    // Save again
    const saveButtonAfterEdit = page.getByRole("button", { name: "Save" });
    await saveButtonAfterEdit.click();

    // Wait for save to complete
    await page.waitForTimeout(1000);

    // Reload the page again
    await page.reload();

    // "New Option" should persist (testing that non-autocomplete values are allowed)
    const titleFieldFinal = page.getByLabel(/title/i).first();
    await expect(titleFieldFinal).toHaveValue("New Option");
  });
});