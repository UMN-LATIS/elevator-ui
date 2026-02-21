import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";

test.describe("Share Button", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId });
  });

  test.describe("on the drawer page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/drawers/viewDrawer/1?resultsView=map");
    });

    test("share button is visible", async ({ page }) => {
      const shareButton = page.getByRole("button", { name: "Share" });
      await expect(shareButton).toBeVisible();
    });

    test("clicking share button opens the share modal", async ({ page }) => {
      await page.getByRole("button", { name: "Share" }).click();

      await expect(page.locator(".modal-contents")).toBeVisible();
      await expect(page.getByRole("heading", { name: "Share" })).toBeVisible();
    });

    test("share modal contains embed and link textboxes", async ({ page }) => {
      await page.getByRole("button", { name: "Share" }).click();

      await expect(page.getByRole("textbox", { name: "Embed" })).toBeVisible();
      await expect(page.getByRole("textbox", { name: "Link" })).toBeVisible();
    });

    test("share modal embed contains drawer URL", async ({ page }) => {
      await page.getByRole("button", { name: "Share" }).click();

      await expect(page.getByRole("textbox", { name: "Embed" })).toHaveValue(
        /\/drawers\/viewDrawer\/1/
      );
    });

    test("share modal closes when Escape is pressed", async ({ page }) => {
      await page.getByRole("button", { name: "Share" }).click();

      const modal = page.locator(".modal-contents");
      await expect(modal).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(modal).toBeHidden();
    });
  });

  test.describe("on the search results page (map view)", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
      const searchInput = page.getByRole("textbox", { name: "Search" }).first();
      await searchInput.fill("location");
      await searchInput.press("Enter");
      await expect(page).toHaveURL(/\/search\//);

      // wait for results to load, then switch tabs
      await expect(page.locator(".search-results-grid")).toBeVisible();
      await page.getByRole("button", { name: "Map" }).click();
    });

    test("share button is visible on map view", async ({ page }) => {
      await expect(page.getByRole("button", { name: "Share" })).toBeVisible();
    });

    test("clicking share button opens the share modal", async ({ page }) => {
      await page.getByRole("button", { name: "Share" }).click();

      await expect(page.locator(".modal-contents")).toBeVisible();
    });

    test("share modal contains embed and link textboxes", async ({ page }) => {
      await page.getByRole("button", { name: "Share" }).click();

      await expect(page.getByRole("textbox", { name: "Embed" })).toBeVisible();
      await expect(page.getByRole("textbox", { name: "Link" })).toBeVisible();
    });

    test("share modal embed URL points to the map search view", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "Share" }).click();

      await expect(page.getByRole("textbox", { name: "Embed" })).toHaveValue(
        /\/search\/map\//
      );
    });
  });

  test.describe("on the search results page (timeline view)", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
      const searchInput = page.getByRole("textbox", { name: "Search" }).first();
      await searchInput.fill("location");
      await searchInput.press("Enter");
      await expect(page).toHaveURL(/\/search\//);

      // wait for results to load, then switch tabs
      await expect(page.locator(".search-results-grid")).toBeVisible();
      await page.getByRole("button", { name: "Timeline" }).click();
    });

    test("share button is visible on timeline view", async ({ page }) => {
      await expect(page.getByRole("button", { name: "Share" })).toBeVisible();
    });

    test("share modal embed URL points to the timeline search view", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "Share" }).click();

      await expect(page.getByRole("textbox", { name: "Embed" })).toHaveValue(
        /\/search\/timeline\//
      );
    });
  });
});
