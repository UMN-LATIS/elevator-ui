import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../../setup";

test.describe("Asset Editing", () => {
  test.describe("With Curator Permissions", () => {
    test.beforeEach(async ({ page, request }) => {
      const workerId = test.info().workerIndex.toString();
      await setupWorkerHTTPHeader({ page, workerId });

      // curator has canManageAssets: true
      await refreshDatabase({ request, workerId });
      await loginUser({ request, page, workerId, username: "curator" });

      await page.goto("/");
    });

    test("can edit an existing asset", async ({ page }) => {
      // Asset 1 from the mock seed data
      const assetId = "6875871d4eb080a4880a0f44";
      await page.goto(`/assetManager/editAsset/${assetId}`);

      await expect(page).toHaveURL(
        new RegExp(`/assetManager/editAsset/${assetId}`)
      );

      const titleField = page.getByLabel(/title/i).first();
      await expect(titleField).toBeVisible();
      await expect(titleField).toHaveValue("Asset 1");

      await titleField.fill("Asset 1 - Edited via E2E");

      // wait for the save request to finish, since reloading mid-save
      // aborts it and the edit is lost
      const saveCompleted = page.waitForResponse((response) =>
        response.url().includes("assetManager/submission")
      );
      const saveButton = page.getByRole("button", { name: "Save" });
      await expect(saveButton).toBeEnabled();
      await saveButton.click();
      await saveCompleted;

      await expect(page).toHaveURL(
        new RegExp(`/assetManager/editAsset/${assetId}`)
      );
      await expect(titleField).toHaveValue("Asset 1 - Edited via E2E");

      // the edit persists across a reload
      await page.reload();
      await expect(titleField).toHaveValue("Asset 1 - Edited via E2E");
    });

    test("menu shows asset management options when editing", async ({
      page,
    }) => {
      const assetId = "6875871d4eb080a4880a0f44";
      await page.goto(`/assetManager/editAsset/${assetId}`);

      const menuToggle = page.getByRole("button", { name: "Toggle main menu" });
      await menuToggle.click();

      const menu = page.locator("#app-menu-navigation");
      await expect(menu).toContainText("Manage Assets");

      const manageAssetsButton = page.getByRole("button", {
        name: "Manage Assets",
      });
      await manageAssetsButton.click();
      await expect(menu).toBeVisible();
    });

    test("shows no unsaved changes message when editing without modifications", async ({
      page,
    }) => {
      const assetId = "6875871d4eb080a4880a0f44";
      await page.goto(`/assetManager/editAsset/${assetId}`);

      const titleField = page.getByLabel(/title/i).first();
      await expect(titleField).toHaveValue("Asset 1");

      await expect(page.getByText("No unsaved changes")).toBeVisible();
    });

    test("shows validation message when required fields are cleared during editing", async ({
      page,
    }) => {
      const assetId = "6875871d4eb080a4880a0f44";
      await page.goto(`/assetManager/editAsset/${assetId}`);

      const titleField = page.getByLabel(/title/i).first();
      await expect(titleField).toHaveValue("Asset 1");
      await expect(page.getByText("No unsaved changes")).toBeVisible();

      // the title is required, so clearing it invalidates the form
      await titleField.clear();

      await expect(page.getByText("Missing required:")).toBeVisible();
      const validationText = page
        .locator("text=Missing required:")
        .locator("..");
      await expect(validationText).toContainText("Title");
      await expect(page.getByText("No unsaved changes")).not.toBeVisible();
    });

    test("validation message disappears when required fields are filled during editing", async ({
      page,
    }) => {
      const assetId = "6875871d4eb080a4880a0f44";
      await page.goto(`/assetManager/editAsset/${assetId}`);

      const titleField = page.getByLabel(/title/i).first();
      await expect(titleField).toHaveValue("Asset 1");

      // the title is required, so clearing it invalidates the form
      await titleField.clear();

      await expect(page.getByText("Missing required:")).toBeVisible();
      const saveButton = page.getByRole("button", { name: "Save" });
      await expect(saveButton).toBeDisabled();

      await titleField.fill("Asset 1 - Modified Title");

      await expect(page.getByText("Missing required:")).not.toBeVisible();
      await expect(saveButton).toBeEnabled();
      await expect(page.getByText("No unsaved changes")).not.toBeVisible();
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

    test("hides edit buttons for unauthorized users", async ({ page }) => {
      const assetId = "6875871d4eb080a4880a0f44";
      await page.goto(`/assetManager/asset/${assetId}`);

      await expect(
        page.getByRole("button", { name: /edit/i })
      ).not.toBeVisible();

      const menuToggle = page.getByRole("button", { name: "Toggle main menu" });
      await menuToggle.click();

      const menu = page.locator("#app-menu-navigation");
      await expect(menu).not.toContainText("Manage Assets");
    });

    test.skip("should not allow direct access to asset editing page", () => {
      // TODO: Users without canManageAssets permission should not be able to directly access edit pages
      // Expected behavior:
      // - Should redirect to 403 access denied page
      // - OR show "Access Denied" message on the page
      // - OR redirect to home page with error message
    });
  });

  test.describe("Unauthenticated Access", () => {
    test.beforeEach(async ({ page, request }) => {
      const workerId = test.info().workerIndex.toString();
      await setupWorkerHTTPHeader({ page, workerId });

      // Refresh database but DON'T login - test unauthenticated access
      await refreshDatabase({ request, workerId });
    });

    test.skip("should not allow direct access to asset editing page", () => {
      // TODO: Unauthenticated users should not be able to directly access edit pages
      // Expected behavior:
      // - Should redirect to login/authentication page
      // - OR show "Please log in" message
      // - Should NOT allow access to asset editing functionality
    });
  });
});
