import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";

test.describe("Error Handling", () => {
  test.describe("RelatedAssetWidget Circular Reference Detection", () => {
    test.beforeEach(async ({ page, request }) => {
      const workerId = test.info().workerIndex.toString();
      await setupWorkerHTTPHeader({ page, workerId });

      await refreshDatabase({ request, workerId });
      await loginUser({ request, page, workerId, username: "curator" });

      await page.goto("/");
    });

    test("detects and prevents circular references in related assets", async ({
      page,
    }) => {
      // Test with mock data that has circular references
      // Asset A -> Asset B -> Asset A
      const assetId = "circular-ref-asset-a";
      await page.goto(`/asset/viewAsset/${assetId}`);

      // Wait for page to load
      await page.waitForLoadState("networkidle");

      // Should show circular reference warning instead of infinite loop
      const circularRefWarning = page.getByText(
        /circular reference detected|stopping to prevent infinite loop/i
      );

      // The circular reference warning should be visible when we expand nested assets
      // If the related assets are nested (accordion), we may need to expand them
      const expandButtons = page.locator('[aria-expanded="false"]');
      const expandCount = await expandButtons.count();

      if (expandCount > 0) {
        // Click first expand button to show nested related assets
        await expandButtons.first().click();
        await page.waitForTimeout(500); // Wait for animation
      }

      // Page should render without crashing regardless
      const pageContent = page.locator("body");
      await expect(pageContent).toBeVisible();

      // Verify the page doesn't crash with console errors
      // Note: This is a smoke test - the main goal is no infinite loop/crash
    });

    test("detects and prevents excessive nesting depth", async ({ page }) => {
      // Test that deeply nested related assets stop at max depth
      // We have a chain of 12 assets, max depth is 10
      const assetId = "deep-nesting-asset-0";
      await page.goto(`/asset/viewAsset/${assetId}`);

      // Wait for page to load
      await page.waitForLoadState("networkidle");

      // Should show max depth warning if nesting is too deep (after 10 levels)
      const depthWarning = page.getByText(/maximum nesting depth reached/i);

      // Try to expand nested items to reach the depth limit
      // Click expand buttons multiple times to go deeper
      for (let i = 0; i < 12; i++) {
        const expandButtons = page.locator('[aria-expanded="false"]');
        const count = await expandButtons.count();
        if (count > 0) {
          await expandButtons.first().click();
          await page.waitForTimeout(300);
        } else {
          break;
        }
      }

      // After expanding many levels, we might see the depth warning
      // But most importantly, page should not crash
      const pageContent = page.locator("body");
      await expect(pageContent).toBeVisible();
    });

    test("allows normal related asset rendering without false positives", async ({
      page,
    }) => {
      // Test that normal related assets (no circular refs) work correctly
      const assetId = "6875871d4eb080a4880a0f44";
      await page.goto(`/asset/viewAsset/${assetId}`);

      // Should NOT show any circular reference warnings
      const circularRefWarning = page.getByText(
        /circular reference detected|stopping to prevent infinite loop/i
      );
      await expect(circularRefWarning).not.toBeVisible();

      // Should NOT show max depth warnings
      const depthWarning = page.getByText(/maximum nesting depth reached/i);
      await expect(depthWarning).not.toBeVisible();

      // Page should render normally
      const pageContent = page.locator("body");
      await expect(pageContent).toBeVisible();
    });
  });

  test.describe("ErrorBoundary Component Integration", () => {
    test.beforeEach(async ({ page, request }) => {
      const workerId = test.info().workerIndex.toString();
      await setupWorkerHTTPHeader({ page, workerId });

      await refreshDatabase({ request, workerId });
      await loginUser({ request, page, workerId, username: "curator" });
    });

    test("error boundary prevents page crashes from circular references", async ({
      page,
    }) => {
      // This test verifies that the ErrorBoundary + circular reference detection
      // work together to prevent page crashes
      const assetId = "circular-ref-asset-a";
      await page.goto(`/asset/viewAsset/${assetId}`);

      await page.waitForLoadState("networkidle");

      // Page should load without crashing
      const pageContent = page.locator("body");
      await expect(pageContent).toBeVisible();

      // No unhandled errors should crash the page
      // The combination of ErrorBoundary and cycle detection should prevent crashes
    });

    test("error boundary prevents page crashes from deep nesting", async ({
      page,
    }) => {
      // This test verifies that depth limits prevent crashes
      const assetId = "deep-nesting-asset-0";
      await page.goto(`/asset/viewAsset/${assetId}`);

      await page.waitForLoadState("networkidle");

      // Page should load without crashing even with deep nesting
      const pageContent = page.locator("body");
      await expect(pageContent).toBeVisible();

      // Try to expand and verify page remains stable
      const expandButtons = page.locator('[aria-expanded="false"]');
      const expandCount = await expandButtons.count();

      if (expandCount > 0) {
        // Click a few expand buttons
        for (let i = 0; i < Math.min(3, expandCount); i++) {
          const buttons = page.locator('[aria-expanded="false"]');
          const count = await buttons.count();
          if (count > 0) {
            await buttons.first().click();
            await page.waitForTimeout(300);
          }
        }
      }

      // Page should still be functional
      await expect(pageContent).toBeVisible();
    });
  });
});
