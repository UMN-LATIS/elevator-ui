import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, refreshDatabase, loginUser } from "../setup";

// Long enough that a loop racks up hundreds of requests, short enough to
// keep the suite quick. The looping bug ran at roughly 240 per second per
// endpoint.
const OBSERVATION_MS = 2000;

// A settled page asks for each endpoint once. The bound sits well above
// that and far below a loop, so it does not depend on timing.
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
    // Forcing the failure rather than relying on the mock server having no
    // adminPermissions routes keeps this meaningful once those routes exist.
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
      requestsByEndpoint.set(
        endpoint,
        (requestsByEndpoint.get(endpoint) ?? 0) + 1
      );
    });

    await page.goto("/admin/permissions");
    await page.waitForTimeout(OBSERVATION_MS);

    for (const endpoint of GRANT_ENDPOINTS) {
      const count = requestsByEndpoint.get(endpoint) ?? 0;
      // A count of zero means the page never got far enough to ask, so
      // the bound below would pass for the wrong reason.
      expect(count, `${endpoint} was never requested`).toBeGreaterThan(0);
      expect(
        count,
        `${endpoint} was requested too many times`
      ).toBeLessThanOrEqual(MAX_REQUESTS_PER_ENDPOINT);
    }
  });

  test("still loads normally when the endpoints succeed", async ({ page }) => {
    // The mock server has no adminPermissions routes yet, so the healthy
    // path has to be stubbed to be tested at all.
    for (const endpoint of GRANT_ENDPOINTS) {
      await page.route(`**/adminPermissions/${endpoint}`, (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ [endpoint]: [] }),
        })
      );
    }

    await page.goto("/admin/permissions");

    await expect(
      page.getByRole("heading", { name: "Permissions" })
    ).toBeVisible();
    // The skeletons clear and the empty table settles.
    await expect(
      page.getByRole("button", { name: "Add Permission" }).first()
    ).toBeVisible();
    await expect(page.locator("[data-add-permission-form]")).toHaveCount(0);
  });
});
