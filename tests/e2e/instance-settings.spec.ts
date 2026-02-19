import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";

test.describe("Instance Settings Page", () => {
  test.describe("With Admin Permissions", () => {
    test.beforeEach(async ({ page, request }) => {
      const workerId = test.info().workerIndex.toString();
      await setupWorkerHTTPHeader({ page, workerId });
      await refreshDatabase({ request, workerId });
      await loginUser({ request, page, workerId, username: "admin" });
    });

    test("loads and displays the instance settings form", async ({ page }) => {
      await page.goto("/instances/edit/1");

      await expect(
        page.getByRole("heading", { name: "Instance Settings" })
      ).toBeVisible();

      // General section fields
      await expect(page.getByLabel("Instance Name")).toBeVisible();
      await expect(page.getByLabel("Domain")).toBeVisible();

      // Sidebar actions
      await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
    });

    test("pre-fills form with existing instance values", async ({ page }) => {
      await page.goto("/instances/edit/1");

      await expect(page.getByLabel("Instance Name")).toHaveValue(
        "defaultinstance"
      );
      await expect(page.getByLabel("Domain")).toHaveValue("example.edu");
    });

    test("shows unsaved changes indicator when form is modified", async ({
      page,
    }) => {
      await page.goto("/instances/edit/1");

      // No unsaved changes initially
      await expect(
        page.getByText("You have unsaved changes")
      ).not.toBeVisible();

      // Modify a field
      const nameField = page.getByLabel("Instance Name");
      await nameField.fill("My Updated Instance");

      // Unsaved changes indicator should appear
      await expect(page.getByText("You have unsaved changes")).toBeVisible();
    });

    test("cancel button resets form to saved values", async ({ page }) => {
      await page.goto("/instances/edit/1");

      const nameField = page.getByLabel("Instance Name");
      await nameField.fill("Modified Name");
      await expect(page.getByText("You have unsaved changes")).toBeVisible();

      await page.getByRole("button", { name: "Cancel" }).click();

      // Form should reset to the original value
      await expect(nameField).toHaveValue("defaultinstance");
      await expect(
        page.getByText("You have unsaved changes")
      ).not.toBeVisible();
    });

    test("can save updated instance name", async ({ page }) => {
      await page.goto("/instances/edit/1");

      const nameField = page.getByLabel("Instance Name");
      await nameField.fill("My Renamed Instance");

      await page.getByRole("button", { name: "Save" }).click();

      // Toast should confirm success
      await expect(
        page.getByText("Instance settings saved successfully")
      ).toBeVisible();

      // Unsaved changes indicator should clear
      await expect(
        page.getByText("You have unsaved changes")
      ).not.toBeVisible();
    });

    test("persists saved changes after page reload", async ({ page }) => {
      await page.goto("/instances/edit/1");

      const nameField = page.getByLabel("Instance Name");
      await nameField.fill("Persisted Name");
      await page.getByRole("button", { name: "Save" }).click();

      await expect(
        page.getByText("Instance settings saved successfully")
      ).toBeVisible();

      // Reload and verify value persisted
      await page.reload();
      await expect(page.getByLabel("Instance Name")).toHaveValue(
        "Persisted Name"
      );
    });

    test("table of contents links scroll to the correct sections", async ({
      page,
    }) => {
      await page.goto("/instances/edit/1");

      // TOC is visible on large screens (the test viewport is typically wide enough)
      const storageLink = page.locator("a", { hasText: "Storage" }).first();
      if (await storageLink.isVisible()) {
        await storageLink.click();
        await expect(
          page.getByRole("heading", { name: "Storage" })
        ).toBeInViewport();
      }
    });
  });

  test.describe("Without Admin Permissions", () => {
    test.beforeEach(async ({ page, request }) => {
      const workerId = test.info().workerIndex.toString();
      await setupWorkerHTTPHeader({ page, workerId });
      await refreshDatabase({ request, workerId });
      await loginUser({ request, page, workerId, username: "user" });
    });

    test("shows an error state when a non-admin accesses the page", async ({
      page,
    }) => {
      await page.goto("/instances/edit/1");

      // The API returns 403, so the page should show its error state
      await expect(
        page.getByText("Failed to load instance settings")
      ).toBeVisible();

      // The form should not be rendered
      await expect(page.getByLabel("Instance Name")).not.toBeVisible();
    });
  });
});
