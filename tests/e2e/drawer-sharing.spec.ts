import { test, expect, type Page } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";

// Drawer 1 ("My Drawer") belongs to the admin user, who also owns the
// seeded groups: "Art History Students" (Specific People, one member and
// a grant on the drawer) and "Library Staff" (Unit type, one entry, no
// grant).
const DRAWER_MANAGEMENT_URL = "/drawers/1/manage";
const ART_HISTORY_GROUP_ID = 201;

function groupRow(page: Page, label: string) {
  return page.locator("tr[data-group-row]", { hasText: label });
}

function openRowMenu(page: Page, label: string) {
  return page
    .getByRole("button", { name: `More options for ${label}` })
    .click();
}

function expandGroup(page: Page, label: string) {
  return page
    .getByRole("button", { name: `Toggle members of ${label}` })
    .click();
}

test.describe("Drawer sharing", () => {
  let workerId: string;

  test.beforeEach(async ({ page, request }) => {
    // parallel workers share one mock-server process, so give each test
    // headroom beyond the 10s default
    test.setTimeout(20_000);
    workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "admin" });
    await page.goto(DRAWER_MANAGEMENT_URL);
    await expect(
      page.getByRole("heading", { name: "Drawer Permissions: My Drawer" })
    ).toBeVisible();
  });

  test("lists the drawer's groups with their access levels", async ({
    page,
  }) => {
    await expect(groupRow(page, "Art History Students")).toContainText(
      "View Derivatives (Group 1)"
    );

    // a group with no rule still gets a row, at no access
    await expect(groupRow(page, "Library Staff")).toContainText(
      "No Permissions"
    );
  });

  test("creates a group with an access level", async ({ page }) => {
    await page.getByRole("button", { name: "Create Group" }).click();

    await page.getByLabel("Group Name").fill("Spring Seminar");
    await page
      .getByLabel("Group Type")
      .selectOption({ label: "Specific People" });
    await page.getByRole("combobox", { name: "Permission" }).click();
    await page.getByRole("option", { name: "Search and Browse" }).click();
    await page.getByRole("button", { name: "Save" }).click();

    await expect(
      page.getByText('Group "Spring Seminar" created.')
    ).toBeVisible();
    await expect(groupRow(page, "Spring Seminar")).toContainText(
      "Search and Browse"
    );
  });

  test("edits a group's name and access level", async ({ page }) => {
    await openRowMenu(page, "Art History Students");
    await page.getByRole("menuitem", { name: "Edit Group" }).click();

    // while editing, the row shows inputs instead of the group's name
    const editingRow = page.locator(
      `tr[data-group-row="${ART_HISTORY_GROUP_ID}"]`
    );
    await editingRow.getByLabel("Group name").fill("Art History Alumni");
    await editingRow.getByRole("combobox", { name: "Permission" }).click();
    await page.getByRole("option", { name: "Download Originals" }).click();
    await editingRow.getByRole("button", { name: "Save" }).click();

    await expect(
      page.getByText(
        'Group "Art History Students" renamed to "Art History Alumni".'
      )
    ).toBeVisible();
    await expect(
      page.getByText('"Art History Students" access set to Download Originals.')
    ).toBeVisible();
    await expect(groupRow(page, "Art History Alumni")).toContainText(
      "Download Originals"
    );
  });

  test("removes a group's permissions", async ({ page }) => {
    await openRowMenu(page, "Art History Students");
    await page.getByRole("menuitem", { name: "Remove Permissions" }).click();

    await expect(
      page.getByText('Permissions removed from "Art History Students".')
    ).toBeVisible();

    // the group keeps its row, now at no access
    await expect(groupRow(page, "Art History Students")).toContainText(
      "No Permissions"
    );
  });

  test("deletes a group after confirmation", async ({ page }) => {
    await openRowMenu(page, "Art History Students");
    await page.getByRole("menuitem", { name: "Delete Group" }).click();

    const dialog = page.getByRole("dialog", { name: "Delete Group" });
    await expect(dialog).toContainText("Are you sure you want to delete");
    await dialog.getByRole("button", { name: "Delete", exact: true }).click();

    await expect(
      page.getByText('Group "Art History Students" deleted.')
    ).toBeVisible();
    await expect(groupRow(page, "Art History Students")).not.toBeVisible();
  });

  test("tells a manager the drawer is not theirs to share", async ({
    page,
    request,
  }) => {
    // the curator can manage drawers in general, but not this one
    await loginUser({ request, page, workerId, username: "curator" });
    await page.goto(DRAWER_MANAGEMENT_URL);

    await expect(
      page.getByText("You cannot manage the sharing for this drawer.")
    ).toBeVisible();
  });

  test("revokes another owner's group by levelling it to no access", async ({
    page,
    request,
  }) => {
    // The curator manages the seeded Slide Library but admin owns the
    // granted group, and the mock refuses a foreign delete, so the
    // success toast proves the level-to-zero update ran instead.
    await loginUser({ request, page, workerId, username: "curator" });
    await page.goto("/drawers/2/manage");
    await expect(
      page.getByRole("heading", { name: "Drawer Permissions: Slide Library" })
    ).toBeVisible();

    const foreignRow = groupRow(page, "Art History Students");
    await expect(foreignRow).toContainText("Created by Admin User");
    await expect(foreignRow).toContainText("View Derivatives (Group 1)");

    await openRowMenu(page, "Art History Students");
    await page.getByRole("menuitem", { name: "Remove Permissions" }).click();

    await expect(
      page.getByText('Permissions removed from "Art History Students".')
    ).toBeVisible();
    await expect(foreignRow).toContainText("No Permissions");
  });

  test("reports a failed removal and keeps the group's access", async ({
    page,
  }) => {
    await page.route("**/drawerPermissions/grants/*", (route) =>
      route.fulfill({ status: 500, json: { error: "boom" } })
    );

    await openRowMenu(page, "Art History Students");
    await page.getByRole("menuitem", { name: "Remove Permissions" }).click();

    await expect(
      page.getByText(/Failed to remove permissions from "Art History Students"/)
    ).toBeVisible();
    await expect(groupRow(page, "Art History Students")).toContainText(
      "View Derivatives (Group 1)"
    );
  });
});

test.describe("Drawer group members", () => {
  let workerId: string;

  test.beforeEach(async ({ page, request }) => {
    // parallel workers share one mock-server process, so give each test
    // headroom beyond the 10s default
    test.setTimeout(20_000);
    workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "admin" });
    await page.goto(DRAWER_MANAGEMENT_URL);
    await expandGroup(page, "Art History Students");
    await expect(page.getByText("Regular User", { exact: true })).toBeVisible();
  });

  test("adds a member picked from the directory search", async ({ page }) => {
    await page.getByRole("button", { name: "Add Member" }).click();
    await page.getByLabel("Add member").fill("curator");
    await page.getByRole("option", { name: "Curator User" }).click();
    await page.getByRole("button", { name: "Save new member" }).click();

    await expect(
      page.getByText('Curator User added to "Art History Students".')
    ).toBeVisible();
    await expect(page.getByText("Curator User", { exact: true })).toBeVisible();
  });

  test("removes a member after confirmation", async ({ page }) => {
    await page.getByRole("button", { name: "Remove", exact: true }).click();

    const dialog = page.getByRole("dialog", { name: "Remove member?" });
    await dialog.getByRole("button", { name: "Remove", exact: true }).click();

    await expect(
      page.getByText('Regular User removed from "Art History Students".')
    ).toBeVisible();
    await expect(
      page.getByText("Regular User", { exact: true })
    ).not.toBeVisible();
  });
});

test.describe("Drawer group entries", () => {
  let workerId: string;

  test.beforeEach(async ({ page, request }) => {
    // parallel workers share one mock-server process, so give each test
    // headroom beyond the 10s default
    test.setTimeout(20_000);
    workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "admin" });
    await page.goto(DRAWER_MANAGEMENT_URL);
    await expandGroup(page, "Library Staff");
    await expect(page.getByText("LIBR", { exact: true })).toBeVisible();
  });

  test("adds an entry", async ({ page }) => {
    await page.getByRole("button", { name: "Add Entry" }).click();
    await page.getByLabel("New Library Staff Entry Value").fill("CSCI");
    await page
      .getByRole("button", { name: "Save new entry in Library Staff" })
      .click();

    await expect(
      page.getByText('"CSCI" added to Library Staff.')
    ).toBeVisible();
    await expect(page.getByText("CSCI", { exact: true })).toBeVisible();
  });

  test("edits an entry in place", async ({ page }) => {
    await page
      .getByRole("button", { name: "Edit LIBR in Library Staff" })
      .click();
    await page.getByLabel("Group Library Staff Entry Value").fill("MATH");
    await page
      .getByRole("button", { name: "Save LIBR in Library Staff" })
      .click();

    await expect(page.getByText('"LIBR" changed to "MATH".')).toBeVisible();
    await expect(page.getByText("MATH", { exact: true })).toBeVisible();
  });

  test("removes an entry after confirmation", async ({ page }) => {
    await page
      .getByRole("button", { name: "Remove LIBR from Library Staff" })
      .click();

    const dialog = page.getByRole("dialog", { name: "Remove entry?" });
    await dialog.getByRole("button", { name: "Remove", exact: true }).click();

    // No toast assertion: the refetch that drops the row also unmounts
    // the component holding the mutation, so its success toast never
    // fires. The entry leaving the table is the observable outcome.
    // toHaveCount tolerates the moment when the confirm dialog's copy of
    // the value and the row's "(removing…)" state both match.
    await expect(page.getByText("LIBR", { exact: true })).toHaveCount(0);
  });
});
