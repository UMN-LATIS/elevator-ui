import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, refreshDatabase, loginUser } from "../setup";

// Long enough that a loop racks up hundreds of requests, short enough to
// keep the suite quick. The looping bug ran at roughly 240 per second per
// endpoint.
const OBSERVATION_MS = 2000;

// A settled page asks for each endpoint once. The bound sits well above
// that and far below a loop, so the assertion does not depend on timing.
const MAX_REQUESTS_PER_ENDPOINT = 10;

const GRANT_ENDPOINTS = [
  "groups",
  "groupTypes",
  "instanceGrants",
  "collectionGrants",
];

test.describe("Permissions page against a failing grants endpoint", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "admin" });
  });

  test("stops requesting after the endpoints fail", async ({ page }) => {
    // 404 rather than 500 on purpose: queryClient treats 404 as
    // non-retryable, so each attempt settles immediately. A retryable
    // status would let backoff hide the loop behind its delays.
    // Forcing the failure keeps the test independent of which
    // adminPermissions routes the mock server defines.
    await page.route("**/adminPermissions/**", (route) =>
      route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ message: "Simulated failure" }),
      })
    );

    const requestsByEndpoint = new Map<string, number>();
    page.on("request", (req) => {
      const endpoint = GRANT_ENDPOINTS.find((name) =>
        req.url().includes(`/adminPermissions/${name}`)
      );
      if (!endpoint) return;
      const previousCount = requestsByEndpoint.get(endpoint) ?? 0;
      requestsByEndpoint.set(endpoint, previousCount + 1);
    });

    await page.goto("/admin/permissions");
    await page.waitForTimeout(OBSERVATION_MS);

    for (const endpoint of GRANT_ENDPOINTS) {
      const count = requestsByEndpoint.get(endpoint) ?? 0;
      // A count of zero means the page never got far enough to ask, so
      // the MAX_REQUESTS_PER_ENDPOINT check would pass for the wrong
      // reason.
      expect(count, `${endpoint} was never requested`).toBeGreaterThan(0);
      expect(
        count,
        `${endpoint} was requested too many times`
      ).toBeLessThanOrEqual(MAX_REQUESTS_PER_ENDPOINT);
    }
  });

  test("still loads normally when the endpoints succeed", async ({ page }) => {
    await page.goto("/admin/permissions");

    await expect(
      page.getByRole("heading", { name: "Permissions" })
    ).toBeVisible();
    // a seeded permission row proves the success branch rendered
    await expect(
      page.getByRole("row", { name: /Instance Reviewers/ })
    ).toBeVisible();
    // The toolbar has an Add Permission button of its own, so scope to
    // the table: its add button renders only when every query succeeded.
    await expect(
      page.locator("tbody").getByRole("button", { name: "Add Permission" })
    ).toBeVisible();
    await expect(page.locator("[data-add-permission-form]")).toHaveCount(0);
  });
});
