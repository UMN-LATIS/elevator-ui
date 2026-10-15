import { test, expect } from "@playwright/test";
import {
  setupWorkerHTTPHeader,
  refreshDatabase,
  updateInstance,
} from "../setup";

test.describe("App header theme colors", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await updateInstance({
      request,
      workerId,
      updates: { availableThemes: ["light", "natural"] },
    });
  });

  for (const theme of ["light", "natural"]) {
    test(`logo matches the header text color in the ${theme} theme`, async ({
      page,
    }) => {
      await page.addInitScript((themeName) => {
        localStorage.setItem(`theme-${window.location.hostname}`, themeName);
      }, theme);
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

      const header = page.locator("header.app-header");
      await expect(header.locator(".app-header__wordmark")).toBeVisible();

      const colors = await header.evaluate((element) => {
        const colorOf = (selector: string, property: "color" | "fill") => {
          const target = element.querySelector(selector);
          if (!target) throw new Error(`header has no ${selector}`);
          return getComputedStyle(target)[property];
        };

        return {
          header: getComputedStyle(element).color,
          wordmark: colorOf(".app-header__wordmark", "color"),
          icon: colorOf(".app-header__icon path", "fill"),
        };
      });

      expect(colors.wordmark).toBe(colors.header);
      expect(colors.icon).toBe(colors.header);
    });
  }
});
