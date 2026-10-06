import { test, expect, type Page } from "@playwright/test";
import {
  setupWorkerHTTPHeader,
  loginUser,
  refreshDatabase,
  updateInstance,
} from "../setup";

const UNCHECKED_THEME = "tron";

function saveVisitorTheme(page: Page, theme: string): Promise<void> {
  return page.addInitScript((themeName) => {
    localStorage.setItem(`theme-${window.location.hostname}`, themeName);
  }, theme);
}

function readVisitorTheme(page: Page): Promise<string | null> {
  return page.evaluate(() =>
    localStorage.getItem(`theme-${window.location.hostname}`)
  );
}

test.describe("Default theme", () => {
  let workerId: string;

  test.beforeEach(async ({ page, request }) => {
    workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
  });

  test("admin sets the default theme with theme selection off", async ({
    page,
    request,
  }) => {
    await updateInstance({
      request,
      workerId,
      updates: { enableTheming: false },
    });
    await loginUser({ request, page, workerId, username: "admin" });
    await page.goto("/instances/edit/1");

    await page.getByLabel("Default Theme").selectOption(UNCHECKED_THEME);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByText("Instance settings saved successfully")
    ).toBeVisible();

    await page.reload();
    await expect(page.getByLabel("Default Theme")).toHaveValue(UNCHECKED_THEME);
  });

  test("visitor sees the default theme when theme selection is off", async ({
    page,
    request,
  }) => {
    await updateInstance({
      request,
      workerId,
      updates: { enableTheming: false, defaultTheme: "folwell" },
    });
    await saveVisitorTheme(page, "dark");

    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute("data-theme", "folwell");
  });

  test("visitor whose theme was made unavailable is reset to the default", async ({
    page,
    request,
  }) => {
    await updateInstance({
      request,
      workerId,
      updates: { availableThemes: ["light", "dark"], defaultTheme: "dark" },
    });
    await saveVisitorTheme(page, "folwell");

    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(await readVisitorTheme(page)).toBe("dark");
  });
});
