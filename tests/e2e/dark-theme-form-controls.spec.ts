import { test, expect, type Page, type Locator } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";

const WHITE = "rgb(255, 255, 255)";

// Dark-surfaced themes beyond dark.css. Each must declare `color-scheme: dark`
// so native select popups, date pickers, and scrollbars render dark.
const DARK_THEMES = [
  "construction",
  "hotrod",
  "matrix",
  "nord-dark",
  "tron",
  "vaporwave",
];

// The app reads the saved theme from localStorage at boot, so write it
// directly and reload rather than driving the settings UI.
async function activateTheme(page: Page, theme: string) {
  await page.evaluate(
    (themeName) =>
      localStorage.setItem(`theme-${window.location.hostname}`, themeName),
    theme
  );
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
}

function backgroundColor(locator: Locator): Promise<string> {
  return locator.evaluate((el) => getComputedStyle(el).backgroundColor);
}

test.describe("Dark theme form controls", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
  });

  test("sort select on search results is reachable by its label", async ({
    page,
    request,
  }) => {
    const workerId = test.info().workerIndex.toString();
    await loginUser({ request, page, workerId });

    await page.goto("/");
    const searchInput = page.getByRole("textbox", { name: "Search" }).first();
    await searchInput.fill("test");
    await searchInput.press("Enter");
    await expect(page).toHaveURL(/\/search\//);

    await expect(page.getByLabel("Sort")).toBeVisible();
  });

  test("asset form controls are not painted white on the dark theme", async ({
    page,
    request,
  }) => {
    // Three full page loads: boot, theme reload, then the add-asset form.
    test.setTimeout(30_000);
    const workerId = test.info().workerIndex.toString();
    await loginUser({ request, page, workerId, username: "curator" });

    await page.goto("/");
    await activateTheme(page, "dark");

    await page.goto("/assetManager/addAsset");
    await page
      .getByLabel("Template")
      .selectOption({ label: "All Fields with Autocomplete" });
    await page.getByLabel("Collection").selectOption({ index: 1 });
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByLabel(/title/i).first()).toBeVisible();

    const checkbox = page.locator('input[type="checkbox"]').first();
    await expect(checkbox).toBeVisible();
    expect(await backgroundColor(checkbox), "checkbox widget input").not.toBe(
      WHITE
    );

    await page.getByText("Select an asset...").click();
    const comboboxInput = page.getByPlaceholder("Select Related Assets...");
    await expect(comboboxInput).toBeVisible();
    expect(
      await backgroundColor(comboboxInput),
      "related-asset combobox input"
    ).not.toBe(WHITE);
  });

  test("optional SelectGroup select is not natively required", async ({
    page,
    request,
  }) => {
    const workerId = test.info().workerIndex.toString();
    await loginUser({ request, page, workerId, username: "admin" });

    await page.goto("/instances/edit/1");
    const select = page.getByLabel("Display Custom Header/Footer");
    await expect(select).toBeVisible();
    await expect(select).not.toHaveAttribute("required");
  });

  test("dark themes declare a dark color scheme", async ({
    page,
    request,
  }) => {
    // Six theme activations, each a reload plus a lazy CSS fetch.
    test.setTimeout(60_000);
    const workerId = test.info().workerIndex.toString();
    await loginUser({ request, page, workerId });
    await page.goto("/");

    for (const theme of DARK_THEMES) {
      await activateTheme(page, theme);
      const colorScheme = await page.evaluate(
        () => getComputedStyle(document.documentElement).colorScheme
      );
      expect(colorScheme, `theme ${theme}`).toBe("dark");
    }
  });
});
