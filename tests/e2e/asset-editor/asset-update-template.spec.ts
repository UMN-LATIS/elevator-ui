import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, refreshDatabase, loginUser } from "../../setup";

test.describe("Edit Asset: Update Template", () => {
  test.beforeEach(async ({ page, request }) => {
    // the All Fields Test template's location widget calls out to arcgis
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

  test("updating the templateId should remap the asset to the new template structure", async ({
    page,
  }) => {
    await expect(page).toHaveURL(/\/assetManager\/addAsset/);

    const templateSelect = page.getByLabel("Template");
    await templateSelect.selectOption({ label: "Some Fields" });

    const collectionSelect = page.getByLabel("Collection");
    await collectionSelect.selectOption({ index: 1 });

    const continueButton = page.getByRole("button", { name: "Continue" });
    await expect(continueButton).toBeEnabled({ timeout: 5000 });
    await continueButton.click();

    await expect(
      page.getByRole("heading", { name: "Create Asset" })
    ).toBeVisible();

    await page.getByLabel("Title").fill("Test Asset");

    const checkbox = page.getByLabel("Checkbox");
    await checkbox.check();
    await expect(checkbox).toBeChecked();

    await page
      .getByLabel("Template *")
      .selectOption({ label: "All Fields Test" });

    // the confirm dialog lists the fields the new template has no place for
    const confirmDialog = page.getByRole("dialog", {
      name: "Are you sure?",
    });
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog).toContainText("Date (missing)");

    await confirmDialog.getByRole("button", { name: "Confirm" }).click();
    await expect(confirmDialog).toBeHidden();

    // confirming the change saves without another click
    await expect(page).toHaveURL(/\/assetManager\/editAsset/);

    // the new template's text area widget renders now
    const textAreaWidget = page.locator("section.edit-widget-layout").filter({
      has: page.getByRole("heading", { name: "Big Text" }),
    });
    await textAreaWidget.scrollIntoViewIfNeeded();
    await expect(textAreaWidget).toBeVisible();

    // first() targets the parent's widgets, not the inline asset's
    await expect(page.getByLabel("Checkbox").first()).toBeChecked();
    await expect(page.getByLabel("Title").first()).toHaveValue("Test Asset");
  });
});
