import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, refreshDatabase, loginUser } from "../setup";
import { fileURLToPath } from "url";
import path from "path";

const testDir = path.dirname(fileURLToPath(import.meta.url));

test.describe("Multiple File Upload", () => {
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

  test("upload multiple files simultaneously and verify persistence", async ({
    page,
  }) => {
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
      .fill("Test Asset with Multiple File Uploads");

    const imageWidget = page
      .locator("section.edit-widget-layout")
      .filter({
        has: page.getByRole("heading", {
          name: "Upload",
        }),
      })
      .first();
    await imageWidget.scrollIntoViewIfNeeded();
    await expect(imageWidget).toBeVisible();

    const fileChooserPromise = page.waitForEvent("filechooser");

    await imageWidget.getByRole("button", { name: "browse files" }).click();

    const fileChooser = await fileChooserPromise;
    // Upload multiple files simultaneously
    const testFiles = [
      "test-image.jpg",
      "goldy-mn.png",
      "visit-jones-hall.png",
      "yolo.png",
    ].map((filename) => path.join(testDir, "..", "fixtures", filename));

    await fileChooser.setFiles(testFiles);

    // verify that the image widget now has 4 entries
    const imageEntries = imageWidget.locator(".edit-upload-widget-item");
    await expect(imageEntries).toHaveCount(4);

    // wait for network requests to complete
    await page.waitForLoadState("networkidle");

    // // Do a full page refresh to verify persistence
    await page.reload();

    // we sould be on the edit asset page now
    await expect(page).toHaveURL(/\/assetManager\/editAsset/);

    // Verify the title is still filled
    await expect(page.getByLabel("Title")).toHaveValue(
      "Test Asset with Multiple File Uploads"
    );
    // and that the image widget has 4 entries
    await expect(imageWidget.locator(".edit-upload-widget-item")).toHaveCount(
      4
    );
  });

  test("multiple upload widgets in the same template", async ({ page }) => {
    await expect(page).toHaveURL(/\/assetManager\/addAsset/);

    // Select template and collection
    const templateSelect = page.getByLabel("Template");
    await templateSelect.selectOption({ label: "Multiple Upload Widgets" });

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
      .fill("Test Asset with Multiple File Uploads");

    // check that multiple upload widget works
    const multUploadWidget = page.locator("section.edit-widget-layout").filter({
      has: page.getByRole("heading", {
        name: "Multiple Uploads",
      }),
    });

    await expect(multUploadWidget).toBeVisible();
    await multUploadWidget.scrollIntoViewIfNeeded();
    const fileChooserPromise = page.waitForEvent("filechooser");
    await multUploadWidget
      .getByRole("button", { name: "browse files" })
      .click();
    const fileChooser = await fileChooserPromise;
    // Upload multiple files simultaneously
    const testFiles = [
      "test-image.jpg",
      "goldy-mn.png",
      "visit-jones-hall.png",
      "yolo.png",
    ].map((filename) => path.join(testDir, "..", "fixtures", filename));
    await fileChooser.setFiles(testFiles);

    // verify that the widget now has 4 entries
    await expect(
      multUploadWidget.locator(".edit-upload-widget-item")
    ).toHaveCount(4);

    const singleUploadWidget = page
      .locator("section.edit-widget-layout")
      .filter({
        has: page.getByRole("heading", {
          name: "Single Upload",
        }),
      });

    await expect(singleUploadWidget).toBeVisible();
    await singleUploadWidget.scrollIntoViewIfNeeded();
    const singleFileChooserPromise = page.waitForEvent("filechooser");
    await singleUploadWidget
      .getByRole("button", { name: "browse files" })
      .click();
    const singleFileChooser = await singleFileChooserPromise;

    await singleFileChooser.setFiles(
      path.join(testDir, "..", "fixtures", "goldy-mn.png")
    );

    // verify that the widget now has 4 entries
    await expect(
      singleUploadWidget.locator(".edit-upload-widget-item")
    ).toHaveCount(1);

    // wait for network requests to complete
    await page.waitForLoadState("networkidle");

    // // Do a full page refresh to verify persistence
    await page.reload();

    // we sould be on the edit asset page now
    await expect(page).toHaveURL(/\/assetManager\/editAsset/);

    // Verify the title is still filled
    await expect(page.getByLabel("Title").first()).toHaveValue(
      "Test Asset with Multiple File Uploads"
    );

    const entries = page.locator(".edit-upload-widget-item");
    await expect(entries).toHaveCount(5);
  });
});
