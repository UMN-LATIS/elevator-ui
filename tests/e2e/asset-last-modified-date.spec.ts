import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  setupWorkerHTTPHeader,
  loginUser,
  refreshDatabase,
  updateInstance,
} from "../setup";

// Asset 1 from seed data — modified 2025-07-14 22:40:25.000000, timezone UTC
const KNOWN_ASSET_ID = "6875871d4eb080a4880a0f44";

/**
 * The row is gated on the instance nav response as well as the asset, and an
 * unresolved nav also hides it. Waiting on both keeps a missing row from
 * reading as "the setting is off" when it really means "not loaded yet".
 */
async function openAssetAwaitingInstanceNav(page: Page) {
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/home/getInstanceNav")),
    page.waitForResponse((r) =>
      r.url().includes(`/asset/viewAsset/${KNOWN_ASSET_ID}`)
    ),
    page.goto(`/asset/viewAsset/${KNOWN_ASSET_ID}`),
  ]);
}

test.describe("Asset last modified date", () => {
  let workerId: string;

  test.beforeEach(async ({ page, request }) => {
    workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId });
  });

  test("is hidden when the instance setting is off", async ({ page }) => {
    await openAssetAwaitingInstanceNav(page);

    await expect(page.getByText("Last Modified")).toHaveCount(0);
  });

  test("shows the modified date and its timezone when the setting is on", async ({
    page,
    request,
  }) => {
    // refreshDatabase in beforeEach re-seeds, so the override has to come after it
    await updateInstance({
      request,
      workerId,
      updates: { showAssetLastModifiedDate: true },
    });

    await openAssetAwaitingInstanceNav(page);

    const row = page.locator(".tuple", { hasText: "Last Modified" });
    await expect(row).toBeVisible();

    // Asserting the year and zone rather than a full timestamp, which varies
    // with the test runner's locale
    const value = row.locator(".tuple__value");
    await expect(value).toContainText("2025");
    await expect(value).toContainText("(UTC)");
  });
});
