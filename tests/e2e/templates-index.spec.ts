import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";

// Template seeds in insertion order (NOT sorted by name)
const TEMPLATE_NAMES_INSERTION_ORDER = [
  "Broken Template (for testing)",
  "Some Fields",
  "All Fields Test",
  "Multiple Upload Widgets",
  "All Fields with Autocomplete",
];

const TEMPLATE_NAMES_SORTED = [...TEMPLATE_NAMES_INSERTION_ORDER].sort((a, b) =>
  a.localeCompare(b)
);

test.describe("Templates Index Page", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "admin" });
  });

  test("Admin menu > Edit Templates link navigates to the Templates page", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Toggle main menu" }).click();

    // The "Admin" disclosure group needs to be expanded first
    await page.getByRole("button", { name: "Admin" }).click();

    await page.getByRole("link", { name: "Edit Templates" }).click();

    // Router base is /defaultinstance, so full path includes that prefix
    await expect(page).toHaveURL("/defaultinstance/templates");
    await expect(
      page.getByRole("heading", { name: "Templates" })
    ).toBeVisible();
  });

  test("displays all templates in the table", async ({ page }) => {
    await page.goto("/templates");

    // One row per template seed, excluding the header row
    const dataRows = page.locator("table tbody tr");
    await expect(dataRows).toHaveCount(TEMPLATE_NAMES_INSERTION_ORDER.length);

    // All template names should appear somewhere in the table
    for (const name of TEMPLATE_NAMES_INSERTION_ORDER) {
      await expect(page.getByRole("cell", { name, exact: true })).toBeVisible();
    }
  });

  // The frontend sorts alphabetically via the useAllTemplatesQuery select transform.
  test("templates are sorted alphabetically by name", async ({ page }) => {
    await page.goto("/templates");

    // The name column is the second column (ID | Name | Created | Modified | Actions)
    const nameCells = page.locator("table tbody tr td:nth-child(2)");

    // allTextContents() does not auto-wait — wait for rows to be present first
    await expect(nameCells.first()).toBeVisible();
    const actualNames = await nameCells.allTextContents();

    expect(actualNames).toEqual(TEMPLATE_NAMES_SORTED);
  });

  test("table column headers are rendered correctly", async ({ page }) => {
    await page.goto("/templates");

    // Table only renders after the API response — wait for the header row
    await expect(page.locator("thead")).toBeVisible();

    await expect(
      page.locator("thead th").filter({ hasText: "ID" })
    ).toBeVisible();
    await expect(
      page.locator("thead th").filter({ hasText: "Name" })
    ).toBeVisible();
    await expect(
      page.locator("thead th").filter({ hasText: "Created" })
    ).toBeVisible();
    await expect(
      page.locator("thead th").filter({ hasText: "Modified" })
    ).toBeVisible();
  });

  test("renders correct template field values in each row", async ({
    page,
  }) => {
    await page.goto("/templates");

    // Spot-check a known row: "All Fields Test" (id: 68, no dates in seed data)
    const allFieldsRow = page
      .locator("table tbody tr")
      .filter({ hasText: "All Fields Test" });

    await expect(allFieldsRow).toBeVisible();

    // ID column
    await expect(allFieldsRow.locator("td:nth-child(1)")).toHaveText("68");

    // Name column
    await expect(allFieldsRow.locator("td:nth-child(2)")).toHaveText(
      "All Fields Test"
    );

    // Created and Modified columns show formatted dates from seed data.
    // Accept any separator (/, ., -) so the assertion holds across locales.
    await expect(allFieldsRow.locator("td:nth-child(3)")).toHaveText(/\d+[/.\-]\d+[/.\-]\d+/);
    await expect(allFieldsRow.locator("td:nth-child(4)")).toHaveText(/\d+[/.\-]\d+[/.\-]\d+/);
  });
});
