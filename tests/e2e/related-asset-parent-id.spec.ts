import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, refreshDatabase } from "../setup";

test.describe("Related asset parent ID", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
  });

  test("collapsed inline related asset passes parent asset ID when fetching auth-required child", async ({
    page,
  }) => {
    // Visit the public parent that has a collapsed related asset widget
    // pointing to an auth-required child. Without the parentAssetId in the
    // fetch URL, the child returns 401 and won't render.
    await page.goto("/asset/viewAsset/collapsed_parent_001");

    // The collapsed inline related asset should render the child's title.
    // If parentAssetId is missing from the fetch, the mock server returns 401
    // and the child content never appears.
    await expect(
      page.locator(".collapsed-inline-related-asset-widget-item h3", {
        hasText: "Protected Child Asset",
      })
    ).toBeVisible();
  });
});
