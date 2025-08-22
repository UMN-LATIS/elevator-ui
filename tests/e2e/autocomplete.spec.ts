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
    await templateSelect.selectOption({
      label: "All Fields with Autocomplete",
    });

    // Select Default Collection
    const collectionSelect = page.getByLabel("Collection");
    await collectionSelect.selectOption({ label: "Default Collection" });

    // Continue to asset form
    const continueButton = page.getByRole("button", { name: "Continue" });
    await expect(continueButton).toBeEnabled({ timeout: 5000 });
    await continueButton.click();

    // Should see the Create Asset form
    await expect(
      page.getByRole("heading", { name: "Create Asset" })
    ).toBeVisible();

    const titleField = page.getByLabel(/title/i).first();

    // Initially there should be no autocomplete open
    await expect(page.getByRole("option").first()).not.toBeVisible();

    // Select the title input - still no autocomplete should be open
    await titleField.click();
    await expect(page.getByRole("option").first()).not.toBeVisible();

    // Type "tes" and should see autocomplete options
    await titleField.fill("tes");

    // Wait for autocomplete suggestions to appear (they render in a portal as dialog)
    await expect(
      page.getByRole("option", { name: "test 3", exact: true })
    ).toBeVisible({ timeout: 3000 });
    await expect(
      page.getByRole("option", { name: "test 1", exact: true })
    ).toBeVisible();

    // Use keyboard navigation to select "test 3" option
    await titleField.press("ArrowDown"); // Move to first option
    await titleField.press("ArrowDown"); // Move to second option
    await titleField.press("ArrowDown"); // Move to third option (test 3)
    await titleField.press("Enter"); // Select the highlighted option

    // Should see "test 3" in the input
    await expect(titleField).toHaveValue("test 3");

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

  test("autocomplete works for tag fields in All Fields with Autocomplete template", async ({
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
    await templateSelect.selectOption({
      label: "All Fields with Autocomplete",
    });

    // Select Default Collection
    const collectionSelect = page.getByLabel("Collection");
    await collectionSelect.selectOption({ label: "Default Collection" });

    // Continue to asset form
    const continueButton = page.getByRole("button", { name: "Continue" });
    await expect(continueButton).toBeEnabled({ timeout: 5000 });
    await continueButton.click();

    // Should see the Create Asset form
    await expect(
      page.getByRole("heading", { name: "Create Asset" })
    ).toBeVisible();

    // Find the Keywords (tag) field input by its placeholder
    const keywordsInput = page.getByPlaceholder("Keywords...");

    // Initially there should be no autocomplete options visible
    await expect(page.getByRole("option").first()).not.toBeVisible();

    // Test that autocomplete suggestions appear for tag fields
    await keywordsInput.fill("res");

    // Wait for autocomplete suggestions to appear
    await expect(
      page.getByRole("option", { name: "research", exact: true })
    ).toBeVisible({ timeout: 3000 });

    // Clear and type full word to add tag
    await keywordsInput.clear();
    await keywordsInput.fill("research");
    await keywordsInput.press(","); // Use comma to trigger tag addition

    // Should see "research" tag added
    await expect(
      page.getByTestId("tag-item").getByText("research")
    ).toBeVisible();

    // Add a custom tag by typing and using enter
    await keywordsInput.fill("custom-tag");
    await keywordsInput.press("Enter");

    // Should see both tags
    await expect(
      page.getByTestId("tag-item").getByText("research")
    ).toBeVisible();
    await expect(
      page.getByTestId("tag-item").getByText("custom-tag")
    ).toBeVisible();

    // Fill in title field to make asset valid
    const titleField = page.getByLabel(/title/i).first();
    await titleField.fill("Tag Autocomplete Test Asset");

    // Verify that both the autocomplete functionality and tag addition work
    // Test passes if tags are visible after being added
    await expect(page.getByTestId("tag-item")).toHaveCount(2);
  });
});
