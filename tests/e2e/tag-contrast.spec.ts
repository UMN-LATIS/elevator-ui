import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";

const TAG_CONTRAST_ASSET_ID = "tag_contrast_test_001";

test.describe("Tag Contrast", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId });

    await page.goto(`/asset/viewAsset/${TAG_CONTRAST_ASSET_ID}`);
    await expect(page.getByText("Tag Contrast Test Asset")).toBeVisible();
  });

  test("tags meet WCAG AA color contrast requirements", async ({ page }) => {
    // Wait for tag chips to render
    await expect(page.locator(".chip").first()).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include(".chip")
      .withRules(["color-contrast"])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test("clickable tags have a visible icon signifier", async ({ page }) => {
    // Clickable tags are rendered as links with the chip--is-clickable class
    const clickableChips = page.locator(".chip--is-clickable");
    await expect(clickableChips.first()).toBeVisible();

    // Each clickable chip should contain an SVG icon (Lucide ArrowUpRight)
    const count = await clickableChips.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await expect(clickableChips.nth(i).locator("svg")).toBeVisible();
    }
  });
});
