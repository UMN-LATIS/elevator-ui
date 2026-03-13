import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, refreshDatabase, loginUser } from "../setup";
import { fileURLToPath } from "url";
import path from "path";

const testDir = path.dirname(fileURLToPath(import.meta.url));

test.describe("Race condition: no duplicate assets on concurrent saves", () => {
  test.beforeEach(async ({ page, request }) => {
    await page.route("**/arcgis.com/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "{}",
      })
    );
    await page.route("**/basemaps-api.arcgis.com/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "{}",
      })
    );
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });
    await page.goto("/assetManager/addAsset");
  });

  test("concurrent saves during creation only create one asset", async ({
    page,
  }) => {
    // Track how many requests arrive with an empty objectId (i.e. "create new asset").
    // We add an artificial delay so the second save fires while the first is still
    // in-flight — widening the race window. With the mutex fix only one create should
    // ever reach the server; without it, both would arrive with objectId="" and the
    // backend would produce two assets.
    let createCount = 0;

    await page.route("**/assetManager/submission/true", async (route) => {
      const postData = route.request().postData() ?? "";
      // The payload is multipart form data; the JSON field contains `"objectId":""`
      // for new assets and `"objectId":"<id>"` for updates.
      if (postData.includes('"objectId":""')) {
        createCount++;
      }
      // Extra delay on top of the mock server's own delay — ensures the first
      // create is still in-flight when a second save is triggered.
      await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });

    // Select the "Multiple Upload Widgets" template so there are two independent
    // upload widgets, each with its own debounce — maximising the chance that
    // both fire their saves within the race window.
    await page
      .getByLabel("Template")
      .selectOption({ label: "Multiple Upload Widgets" });
    await page.getByLabel("Collection").selectOption({ index: 1 });
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(
      page.getByRole("heading", { name: "Create Asset" })
    ).toBeVisible();

    await page.getByLabel("Title").fill("Race condition test asset");

    const fixtureFile = path.join(testDir, "..", "fixtures", "test-image.jpg");

    // Upload to the first widget
    const widget1 = page.locator("section.edit-widget-layout").filter({
      has: page.getByRole("heading", { name: "Multiple Uploads" }),
    });
    const chooser1Promise = page.waitForEvent("filechooser");
    await widget1.getByRole("button", { name: "browse files" }).click();
    const chooser1 = await chooser1Promise;
    await chooser1.setFiles(fixtureFile);

    // Upload to the second widget immediately — both debounces will fire close
    // together, giving us two concurrent saveAsset() calls.
    const widget2 = page.locator("section.edit-widget-layout").filter({
      has: page.getByRole("heading", { name: "Single Upload" }),
    });
    await widget2.scrollIntoViewIfNeeded();
    const chooser2Promise = page.waitForEvent("filechooser");
    await widget2.getByRole("button", { name: "browse files" }).click();
    const chooser2 = await chooser2Promise;
    await chooser2.setFiles(fixtureFile);

    // Wait for all network activity (uploads + saves) to settle.
    await page.waitForLoadState("networkidle");

    expect(createCount).toBe(1);

    // Confirm we landed on the edit page (not still on /addAsset).
    await expect(page).toHaveURL(/\/assetManager\/editAsset/);
  });
});

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
      .first()
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

    // sleep for 4s to accommodate save cooldown
    await new Promise((r) => setTimeout(r, 4000));

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
    // and that the image widget has 4 entries
    await expect(imageWidget.locator(".edit-upload-widget-item")).toHaveCount(
      4
    );
  });

  test("multiple upload widgets in the same template", async ({ page }) => {
    test.setTimeout(30000);
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

    // sleep for 4s to accommodate save cooldown (same as the single-widget test above)
    await new Promise((r) => setTimeout(r, 4000));

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
