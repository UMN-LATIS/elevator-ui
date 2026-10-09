import { test, expect, type Page } from "@playwright/test";
import { setupWorkerHTTPHeader, refreshDatabase, loginUser } from "../setup";

const USERS_ENDPOINT = "**/adminUsers/users**";
const DESKTOP = { width: 1440, height: 900 };

function userRows(page: Page) {
  return page.getByRole("row").filter({ has: page.getByRole("link") });
}

function rowFor(page: Page, text: string) {
  return userRows(page).filter({ hasText: text });
}

function adminSidebar(page: Page) {
  return page.getByRole("navigation", { name: "Admin" });
}

test.beforeEach(async ({ page, request }) => {
  const workerId = test.info().workerIndex.toString();
  await setupWorkerHTTPHeader({ page, workerId });
  await refreshDatabase({ request, workerId });
  await page.setViewportSize(DESKTOP);
});

test.describe("Admin users page access", () => {
  test("a super admin opens the page from the admin sidebar", async ({
    page,
    request,
  }) => {
    const workerId = test.info().workerIndex.toString();
    await loginUser({ request, page, workerId, username: "admin" });
    await page.goto("/admin/collections");

    await adminSidebar(page)
      .getByRole("link", { name: "Users", exact: true })
      .click();

    await expect(page).toHaveURL(/\/admin\/users$/);
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
  });

  test("an instance admin sees no link and is forbidden by URL", async ({
    page,
    request,
  }) => {
    const workerId = test.info().workerIndex.toString();
    await loginUser({ request, page, workerId, username: "instanceadmin" });
    await page.goto("/admin/collections");

    await expect(
      adminSidebar(page).getByRole("link", { name: "Collections" })
    ).toBeVisible();
    await expect(
      adminSidebar(page).getByRole("link", { name: "Users", exact: true })
    ).toHaveCount(0);

    const userListRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname.endsWith("/adminUsers/users")) {
        userListRequests.push(request.url());
      }
    });

    await page.goto("/admin/users");
    await expect(
      page.getByRole("heading", { name: "Forbidden" })
    ).toBeVisible();
    expect(userListRequests).toEqual([]);
  });
});

test.describe("Admin users page", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await loginUser({ request, page, workerId, username: "admin" });
  });

  test("shows each user's fields, leaving unset ones blank", async ({
    page,
  }) => {
    await page.goto("/admin/users?userType=Local");

    const patRow = rowFor(page, "smit0123");
    await expect(patRow).toContainText("Pat Smith");
    await expect(patRow).toContainText("smit0123@umn.edu");
    await expect(patRow).toContainText("1234567");
    await expect(patRow).toContainText("Art History");
    await expect(patRow).toContainText("5/31/2099");
    await expect(patRow).toContainText("8/14/2026");
    await expect(
      patRow.getByRole("link", { name: "Pat Smith" })
    ).toHaveAttribute("href", /\/permissions\/editUser\/6$/);

    await expect(rowFor(page, "Expired Guest")).toContainText("Expired");

    const adminRow = rowFor(page, "Admin User");
    await expect(adminRow).not.toContainText("Expired");
    await expect(adminRow).not.toContainText("2014");

    const legacyRow = rowFor(page, "legacy");
    await expect(legacyRow.getByRole("link")).toHaveText("legacy");
    await expect(legacyRow).not.toContainText("null");
  });

  test("search narrows the list once typing pauses", async ({ page }) => {
    const searchRequests: string[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (
        url.pathname.endsWith("/adminUsers/users") &&
        url.searchParams.has("search")
      ) {
        searchRequests.push(url.searchParams.get("search") ?? "");
      }
    });

    await page.goto("/admin/users");
    await expect(rowFor(page, "Remote User 110")).toBeVisible();

    await page
      .getByLabel("Search users")
      .pressSequentially("OKAF", { delay: 50 });

    await expect(page).toHaveURL(/search=OKAF/);
    await expect(userRows(page)).toHaveCount(1);
    await expect(rowFor(page, "Robin Okafor")).toBeVisible();
    expect(searchRequests).toEqual(["OKAF"]);
  });

  test("filters combine, and All removes a filter without a 422", async ({
    page,
  }) => {
    const statuses: number[] = [];
    page.on("response", (response) => {
      if (new URL(response.url()).pathname.endsWith("/adminUsers/users")) {
        statuses.push(response.status());
      }
    });

    await page.goto("/admin/users");
    await page.getByLabel("User type").selectOption({ label: "Remote" });
    await page
      .getByLabel("Super admin status")
      .selectOption({ label: "Super admins" });

    await expect(page).toHaveURL(/userType=Remote/);
    await expect(page).toHaveURL(/isSuperAdmin=true/);
    await expect(userRows(page)).toHaveCount(1);
    await expect(rowFor(page, "Robin Okafor")).toBeVisible();

    await page.getByLabel("User type").selectOption({ label: "All types" });

    await expect(page).not.toHaveURL(/userType/);
    await expect(userRows(page)).toHaveCount(2);
    await expect(rowFor(page, "Admin User")).toBeVisible();

    await page
      .getByLabel("Super admin status")
      .selectOption({ label: "All users" });

    await expect(page).toHaveURL(/\/admin\/users$/);
    await expect(rowFor(page, "Remote User 110")).toBeVisible();
    expect(statuses.every((status) => status === 200)).toBe(true);
  });

  test("pages through results, and a filter change returns to page 1", async ({
    page,
  }) => {
    await page.goto("/admin/users");
    await expect(page.getByText("Showing 1–100 of 119 users")).toBeVisible();

    await page.getByRole("button", { name: "Page 2" }).click();

    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText("Showing 101–119 of 119 users")).toBeVisible();
    await expect(rowFor(page, "Admin User")).toBeVisible();

    await page.getByLabel("User type").selectOption({ label: "Local" });

    await expect(page).not.toHaveURL(/page=/);
    await expect(page.getByText("Showing 1–8 of 8 users")).toBeVisible();
    await expect(page.getByRole("button", { name: "Page 1" })).toHaveCount(0);
  });

  test("a page size change returns to page 1", async ({ page }) => {
    await page.goto("/admin/users?page=2");
    await expect(page.getByText("Showing 101–119 of 119 users")).toBeVisible();

    await page
      .getByLabel("Rows per page")
      .selectOption({ label: "25 per page" });

    await expect(page).toHaveURL(/perPage=25/);
    await expect(page).not.toHaveURL(/[?&]page=/);
    await expect(page.getByText("Showing 1–25 of 119 users")).toBeVisible();
    await expect(userRows(page)).toHaveCount(25);
    await expect(page.getByRole("button", { name: "Page 5" })).toBeVisible();
  });

  test("a page number past the end jumps to the last page", async ({
    page,
  }) => {
    await page.goto("/admin/users?page=40");

    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText("Showing 101–119 of 119 users")).toBeVisible();
  });

  test("reload and back keep the search and filters", async ({ page }) => {
    await page.goto("/admin/users?search=smit&userType=Local");

    await expect(page.getByLabel("Search users")).toHaveValue("smit");
    await expect(page.getByLabel("User type")).toHaveValue("Local");
    await expect(userRows(page)).toHaveCount(1);

    await page.reload();
    await expect(page.getByLabel("Search users")).toHaveValue("smit");
    await expect(rowFor(page, "Pat Smith")).toBeVisible();

    await adminSidebar(page).getByRole("link", { name: "Collections" }).click();
    await expect(page).toHaveURL(/\/admin\/collections$/);
    await page.goBack();

    await expect(page).toHaveURL(/search=smit/);
    await expect(page.getByLabel("Search users")).toHaveValue("smit");
    await expect(userRows(page)).toHaveCount(1);
  });

  test("the sidebar Users link clears the search box", async ({ page }) => {
    await page.goto("/admin/users?search=smit");
    await expect(page.getByLabel("Search users")).toHaveValue("smit");

    await adminSidebar(page)
      .getByRole("link", { name: "Users", exact: true })
      .click();

    await expect(page).toHaveURL(/\/admin\/users$/);
    await expect(page.getByLabel("Search users")).toHaveValue("");
    await expect(rowFor(page, "Remote User 110")).toBeVisible();
  });

  test("shows the loading, empty, and error states", async ({ page }) => {
    await page.route(USERS_ENDPOINT, async (route) => {
      await expect(page.getByText("Loading users…")).toBeVisible();
      await route.continue();
    });

    await page.goto("/admin/users?search=zzzz");
    await expect(page.getByText("No users match the filter.")).toBeVisible();

    await page.unroute(USERS_ENDPOINT);
    await page.route(USERS_ENDPOINT, (route) =>
      route.fulfill({ status: 404, json: { error: "Not Found" } })
    );
    await page.reload();

    await expect(page.getByText("Could not load users.")).toBeVisible();
  });
});
