import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, refreshDatabase, loginUser } from "../setup";

// Every admin page, with the sidebar item each one should light up.
const ADMIN_ROUTES = [
  { path: "/admin/permissions", activeItem: "Permissions" },
  { path: "/admin/collections", activeItem: "Collections" },
  { path: "/admin/collections/edit", activeItem: "Collections" },
  { path: "/admin/collections/edit/1", activeItem: "Collections" },
  { path: "/templates", activeItem: "Templates" },
  { path: "/templates/edit", activeItem: "Templates" },
  { path: "/templates/edit/1", activeItem: "Templates" },
  { path: "/instances/customPages", activeItem: "Pages" },
  { path: "/instances/createPage", activeItem: "Pages" },
  { path: "/instances/editPage/1", activeItem: "Pages" },
  { path: "/instances/edit/1", activeItem: "Instance Settings" },
];

const DESKTOP = { width: 1440, height: 900 };
const BELOW_XL = { width: 1024, height: 900 };

test.describe("Admin sidebar", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "admin" });
    await page.setViewportSize(DESKTOP);
  });

  for (const { path, activeItem } of ADMIN_ROUTES) {
    test(`${path} shows the sidebar with ${activeItem} active`, async ({
      page,
    }) => {
      await page.goto(path);

      const sidebar = page.getByRole("navigation", { name: "Admin" });
      await expect(sidebar).toBeVisible();
      await expect(
        sidebar.getByRole("link", { name: activeItem, exact: true })
      ).toHaveClass(/is-active/);
    });
  }

  test("the sidebar runs to the bottom of a page shorter than the screen", async ({
    page,
  }) => {
    await page.goto("/templates");
    await expect(page.getByRole("navigation", { name: "Admin" })).toBeVisible();

    const measurements = await page.evaluate(() => {
      const nav = document.querySelector('nav[aria-label="Admin"]');
      if (!nav) return null;
      return {
        navBottom: nav.getBoundingClientRect().bottom,
        viewportHeight: window.innerHeight,
        documentHeight: document.documentElement.scrollHeight,
      };
    });

    if (!measurements) throw new Error("Admin sidebar was not in the DOM");

    // Guards the h-full regression: `height: 100%` could not resolve against
    // a flex-sized parent, so the nav collapsed to its content height.
    expect(measurements.navBottom).toBeGreaterThanOrEqual(
      measurements.viewportHeight - 1
    );
    // A short page must not have grown a scrollbar to reach the bottom.
    expect(measurements.documentHeight).toBeLessThanOrEqual(
      measurements.viewportHeight + 1
    );
  });

  test("the nav links stay on screen when a long page scrolls", async ({
    page,
  }) => {
    // Instance Settings is the longest admin page, well past a screenful.
    await page.goto("/instances/edit/1");
    const firstLink = page
      .getByRole("navigation", { name: "Admin" })
      .getByRole("link")
      .first();
    await expect(firstLink).toBeVisible();

    const topBeforeScroll = await firstLink.evaluate(
      (el) => el.getBoundingClientRect().top
    );

    await page.evaluate(() => window.scrollTo(0, 1200));
    await expect
      .poll(() => page.evaluate(() => Math.round(window.scrollY)))
      .toBeGreaterThan(0);

    const topAfterScroll = await firstLink.evaluate(
      (el) => el.getBoundingClientRect().top
    );

    expect(topAfterScroll).toBeCloseTo(topBeforeScroll, 0);
    await expect(firstLink).toBeInViewport();
  });

  test("the sidebar is hidden below the xl breakpoint", async ({ page }) => {
    await page.setViewportSize(BELOW_XL);
    await page.goto("/admin/collections");

    await expect(
      page.getByRole("heading", { name: "Collections" })
    ).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Admin" })).toBeHidden();
  });
});
