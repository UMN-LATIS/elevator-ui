import { test, expect, type Page } from "@playwright/test";
import {
  MOCK_SERVER_BASE,
  setupWorkerHTTPHeader,
  refreshDatabase,
  loginUser,
} from "../setup";

// Enough rows that the table runs well past the fold, so the new group's
// row is nowhere near the Add Permission button that created it.
const FILLER_GROUP_COUNT = 12;

const SEARCH_AND_BROWSE_LEVEL_ID = 4;

// Sorts above every filler group, so revealing its row has to scroll a
// long way back up the page rather than staying put.
const NEW_GROUP_LABEL = "AAA New Reviewers";

async function seedGroupWithInstanceGrant({
  page,
  workerId,
  label,
}: {
  page: Page;
  workerId: string;
  label: string;
}): Promise<void> {
  const headers = { "x-worker-id": workerId };
  const base = `${MOCK_SERVER_BASE}/defaultinstance/adminPermissions`;

  const groupResponse = await page.request.post(`${base}/groups`, {
    form: { label, type: "User" },
    headers,
  });
  if (!groupResponse.ok()) {
    throw new Error(
      `Could not seed group "${label}": ${groupResponse.status()}`
    );
  }
  const { group } = await groupResponse.json();

  const grantResponse = await page.request.post(`${base}/instanceGrants`, {
    form: { groupId: group.id, permissionLevelId: SEARCH_AND_BROWSE_LEVEL_ID },
    headers,
  });
  if (!grantResponse.ok()) {
    throw new Error(
      `Could not seed grant for "${label}": ${grantResponse.status()}`
    );
  }
}

test.describe("Adding a permission for a new group from a long table", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "admin" });

    // Every mock route sleeps before it answers, so seeding one row at a
    // time spends most of the test's budget waiting.
    await Promise.all(
      Array.from({ length: FILLER_GROUP_COUNT }, (_, index) =>
        seedGroupWithInstanceGrant({
          page,
          workerId,
          label: `Filler Group ${String(index + 1).padStart(2, "0")}`,
        })
      )
    );
  });

  test("scrolls the new group's member input into view", async ({ page }) => {
    await page.goto("/admin/permissions");
    await expect(
      page.getByRole("row", { name: /Filler Group 12/ })
    ).toBeVisible();

    const addPermissionForm = page.locator("[data-add-permission-form]");
    const tableAddButton = page
      .locator("tbody")
      .getByRole("button", { name: "Add Permission" });

    // Start from the bottom of the table, where a user who scrolled through
    // their permissions would be.
    await tableAddButton.scrollIntoViewIfNeeded();
    await tableAddButton.click();

    await addPermissionForm
      .locator(".add-permission__group-input")
      .fill(NEW_GROUP_LABEL);
    await page.getByText(`Create group "${NEW_GROUP_LABEL}"`).click();
    await addPermissionForm.getByLabel("Group Type").selectOption("User");
    await addPermissionForm.getByLabel("Permission").click();
    await page.getByRole("option", { name: "Search and Browse" }).click();
    await addPermissionForm.getByRole("button", { name: "Save" }).click();

    const memberInput = page.locator("[data-group-add-member-form] input");
    await expect(memberInput).toBeVisible();

    // The member list mounts on skeleton rows and drops them once the
    // (empty) list arrives, so the input has to still be on screen after
    // that shift, not only before it.
    await expect(page.locator(".skeleton")).toHaveCount(0);

    await expect(memberInput).toBeFocused();
    await expect(memberInput).toBeInViewport({ ratio: 1 });
  });
});
