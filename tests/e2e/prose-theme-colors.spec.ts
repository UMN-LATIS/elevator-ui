import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, refreshDatabase } from "../setup";

const RICH_TEXT_ASSET_ID = "rich_text_asset_001";

test.describe("Prose theme colors", () => {
  let workerId: string;

  test.beforeEach(async ({ page, request }) => {
    workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });

    await page.addInitScript(() => {
      localStorage.setItem(`theme-${window.location.hostname}`, "dark");
    });
  });

  test("bold text matches the surrounding body text", async ({ page }) => {
    await page.goto(`/asset/viewAsset/${RICH_TEXT_ASSET_ID}`);

    // A theme's stylesheet is fetched lazily and `data-theme` is set in its
    // load handler, so waiting on the attribute proves the CSS has landed.
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    const boldText = page.locator(".prose strong").first();
    await expect(boldText).toBeVisible();

    const colors = await boldText.evaluate((element) => {
      const proseBlock = element.closest(".prose");
      if (!proseBlock) throw new Error("bold text has no .prose ancestor");

      return {
        bold: getComputedStyle(element).color,
        body: getComputedStyle(proseBlock).color,
      };
    });

    expect(colors.bold).toBe(colors.body);
  });
});
