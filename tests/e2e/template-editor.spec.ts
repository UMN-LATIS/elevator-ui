import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";

// Seed templates available in the test database after refreshDatabase()
const SOME_FIELDS_ID = 1; // "Some Fields" — has at least 2 widgets
const MISSING_TEMPLATE_ID = 99999;

test.describe("Template Editor", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "admin" });
  });

  // ---------------------------------------------------------------------------
  // Create mode
  // ---------------------------------------------------------------------------

  test.describe("Create mode", () => {
    test("shows 'New Template' heading on create page", async ({ page }) => {
      await page.goto("/templates/edit");
      await expect(
        page.getByRole("heading", { name: "New Template" })
      ).toBeVisible();
    });

    test("creates a template and redirects to edit URL with new id", async ({
      page,
    }) => {
      await page.goto("/templates/edit");
      await page.getByLabel("Name").fill("E2E Created Template");
      await page.getByRole("button", { name: "Save" }).click();

      // URL should update to /templates/edit/:id after successful creation
      await expect(page).toHaveURL(/\/templates\/edit\/\d+/);

      // Heading switches to edit mode
      await expect(
        page.getByRole("heading", { name: "Edit Template" })
      ).toBeVisible();
    });

    test("created template appears in the templates index", async ({ page }) => {
      await page.goto("/templates/edit");
      await page.getByLabel("Name").fill("Brand New Template");
      await page.getByRole("button", { name: "Save" }).click();
      await expect(page).toHaveURL(/\/templates\/edit\/\d+/);

      await page.goto("/templates");
      await expect(
        page.getByRole("cell", { name: "Brand New Template", exact: true })
      ).toBeVisible();
    });

    test("clicking '+ Add field' adds a widget with a Remove button", async ({
      page,
    }) => {
      await page.goto("/templates/edit");
      await expect(
        page.getByRole("button", { name: "Remove field" })
      ).toHaveCount(0);

      await page.getByRole("button", { name: "+ Add field" }).click();

      await expect(
        page.getByRole("button", { name: "Remove field" })
      ).toHaveCount(1);
    });

    test("saves a template with a widget and the widget persists after reload", async ({
      page,
    }) => {
      await page.goto("/templates/edit");
      await page.getByLabel("Name").fill("Template With Widget");
      await page.getByRole("button", { name: "+ Add field" }).click();
      await page.getByLabel("Label").fill("My Custom Field");
      await page.getByRole("button", { name: "Save" }).click();
      await expect(page).toHaveURL(/\/templates\/edit\/\d+/);

      await page.reload();
      await expect(page.getByLabel("Label")).toHaveValue("My Custom Field");
    });
  });

  // ---------------------------------------------------------------------------
  // Edit mode
  // ---------------------------------------------------------------------------

  test.describe("Edit mode", () => {
    test("shows 'Edit Template' heading and pre-populates name", async ({
      page,
    }) => {
      await page.goto(`/templates/edit/${SOME_FIELDS_ID}`);
      await expect(
        page.getByRole("heading", { name: "Edit Template" })
      ).toBeVisible();
      await expect(page.getByLabel("Name")).toHaveValue("Some Fields");
    });

    test("saves updated template name and shows it in the index", async ({
      page,
    }) => {
      await page.goto(`/templates/edit/${SOME_FIELDS_ID}`);
      await page.getByLabel("Name").clear();
      await page.getByLabel("Name").fill("Renamed Template");
      await page.getByRole("button", { name: "Save" }).click();

      await page.goto("/templates");
      await expect(
        page.getByRole("cell", { name: "Renamed Template", exact: true })
      ).toBeVisible();
    });

    test("removes a widget, saves, and it is gone after reload", async ({
      page,
    }) => {
      await page.goto(`/templates/edit/${SOME_FIELDS_ID}`);

      const removeButtons = page.getByRole("button", { name: "Remove field" });
      await expect(removeButtons.first()).toBeVisible();
      const countBefore = await removeButtons.count();
      expect(countBefore).toBeGreaterThan(0);

      await removeButtons.first().click();
      await page.getByRole("button", { name: "Save" }).click();
      await page.waitForResponse((r) => r.url().includes("/templates/update"));

      await page.reload();
      await expect(
        page.getByRole("button", { name: "Remove field" })
      ).toHaveCount(countBefore - 1);
    });
  });

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------

  test("shows error UI when navigating to a non-existent template ID", async ({
    page,
  }) => {
    await page.goto(`/templates/edit/${MISSING_TEMPLATE_ID}`);
    await expect(page.getByText("Failed to load template.")).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Unsaved changes indicator and last modified date
  // ---------------------------------------------------------------------------

  test.describe("Unsaved changes and last modified", () => {
    test("shows 'No unsaved changes' after loading an existing template", async ({
      page,
    }) => {
      await page.goto(`/templates/edit/${SOME_FIELDS_ID}`);
      await expect(page.getByLabel("Name")).toBeVisible();
      await expect(page.getByText("No unsaved changes")).toBeVisible();
    });

    test("hides 'No unsaved changes' once the form is edited", async ({
      page,
    }) => {
      await page.goto(`/templates/edit/${SOME_FIELDS_ID}`);
      await expect(page.getByText("No unsaved changes")).toBeVisible();

      await page.getByLabel("Name").fill("Changed Name");

      await expect(page.getByText("No unsaved changes")).not.toBeVisible();
    });

    test("shows 'No unsaved changes' again after saving edits", async ({
      page,
    }) => {
      await page.goto(`/templates/edit/${SOME_FIELDS_ID}`);
      await page.getByLabel("Name").fill("Changed Again");
      await expect(page.getByText("No unsaved changes")).not.toBeVisible();

      await page.getByRole("button", { name: "Save" }).click();
      await page.waitForResponse((r) => r.url().includes("/templates/update"));

      await expect(page.getByText("No unsaved changes")).toBeVisible();
    });

    test("shows 'No unsaved changes' on the create page before typing", async ({
      page,
    }) => {
      await page.goto("/templates/edit");
      await expect(page.getByText("No unsaved changes")).toBeVisible();
    });

    test("hides 'No unsaved changes' on the create page after typing a name", async ({
      page,
    }) => {
      await page.goto("/templates/edit");
      await page.getByLabel("Name").fill("Something");
      await expect(page.getByText("No unsaved changes")).not.toBeVisible();
    });

    test("shows last modified date for an existing template", async ({
      page,
    }) => {
      await page.goto(`/templates/edit/${SOME_FIELDS_ID}`);
      // "Some Fields" seed has modifiedAt: "2024-03-20T14:30:00+00:00"
      // We just need to confirm some date-like text is rendered.
      await expect(
        page.locator("[data-testid='last-modified']")
      ).toBeVisible();
    });
  });
});
