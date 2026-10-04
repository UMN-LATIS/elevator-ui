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
  // The timeout covers beforeEach, and seeding 12 groups against routes
  // that sleep before answering spends most of the default 10s before
  // the test clicks anything.
  test.describe.configure({ timeout: 30_000 });

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
    const permissionsTable = page.getByRole("table").first();
    await expect(
      permissionsTable.getByRole("row", { name: /Filler Group 12/ })
    ).toBeVisible();

    await page.getByRole("button", { name: "Create Permission" }).click();

    const dialog = page.getByRole("dialog", { name: "Create Permission" });
    await dialog.locator(".add-permission__group-input").fill(NEW_GROUP_LABEL);
    await page.getByText(`Create group "${NEW_GROUP_LABEL}"`).click();
    await dialog.getByLabel("Group Type").selectOption("User");
    await dialog.getByLabel("Permission").click();
    await page.getByRole("option", { name: "Search and Browse" }).click();
    await dialog.getByRole("button", { name: "Create" }).click();

    const memberInput = page.locator("[data-group-add-member-form] input");
    await expect(memberInput).toBeVisible();

    // The member list first renders a loading row and
    // removes it once the (empty) list arrives, so the
    // input has to still be on screen after the loading
    // row is gone, not only before it.
    await expect(page.getByText("Loading members…")).toHaveCount(0);

    await expect(memberInput).toBeFocused();
    await expect(memberInput).toBeInViewport({ ratio: 1 });

    // The site header is sticky, so clearing the viewport edges is not
    // enough. A field sitting under the header is still out of reach.
    const clearanceBelowHeader = await memberInput.evaluate((input) => {
      const header = document.querySelector("header");
      const headerBottom = header?.getBoundingClientRect().bottom ?? 0;
      return input.getBoundingClientRect().top - headerBottom;
    });
    expect(clearanceBelowHeader).toBeGreaterThan(0);
  });
});
