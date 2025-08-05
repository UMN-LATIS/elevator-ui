import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, refreshDatabase, loginUser } from "../setup";

test.describe("Edit Asset: Update Template", () => {
  test.beforeEach(async ({ page, request }) => {
    // Block ArcGIS requests
    await page.route("**/arcgis.com/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({}),
      });
    });

    await page.route("**/basemaps-api.arcgis.com/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({}),
      });
    });
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });
    await page.goto("/assetManager/addAsset");
  });

  test("updating the templateId should remap the the asset to the new template structure", async ({
    page,
  }) => {
    // SETUP - create an asset with template
    await expect(page).toHaveURL(/\/assetManager\/addAsset/);

    // Select template and collection
    const templateSelect = page.getByLabel("Template");
    await templateSelect.selectOption({ label: "Some Fields" });

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
    await page.getByLabel("Title").fill("Test Asset");

    // check the checkbox field
    const checkbox = page.getByLabel("Checkbox");
    await checkbox.check();
    await expect(checkbox).toBeChecked();

    // now change the template
    const selectTemplate = page.getByLabel("Template *");
    await selectTemplate.selectOption({ label: "All Fields Test" });

    // a confirmation dialog should appear
    const confirmDialog = page.getByRole("dialog", {
      name: "Are you sure?",
    });
    await expect(confirmDialog).toBeVisible();
    // dialog should show that the date is missing from the new template
    await expect(confirmDialog).toContainText("Date (missing)");

    // confirm the change
    const confirmButton = confirmDialog.getByRole("button", {
      name: "Confirm",
    });
    await confirmButton.click();

    // wait for dialog to disappear
    await expect(confirmDialog).toBeHidden();

    // save should trigger automatically
    await page.waitForLoadState("networkidle");

    // we should be on the edit page now
    await expect(page).toHaveURL(/\/assetManager\/editAsset/);

    // the updated form should show the date widget now
    const textAreaWidget = page.locator("section.edit-widget-layout").filter({
      has: page.getByRole("heading", { name: "Big Text" }),
    });
    await textAreaWidget.scrollIntoViewIfNeeded();
    await expect(textAreaWidget).toBeVisible();

    // the checkbox field should still be checked
    await expect(page.getByLabel("Checkbox")).toBeChecked();
    // the title field should still have the value
    await expect(page.getByLabel("Title")).toHaveValue("Test Asset");
  });
});
