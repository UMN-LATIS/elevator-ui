import { test, expect } from "@playwright/test";
import {
  setupWorkerHTTPHeader,
  loginUser,
  refreshDatabase,
  updateInstance,
} from "../setup";

// Extend Window type to include our test tracking object
declare global {
  interface Window {
    eventListenerCallCounts: {
      contentLoaded: number;
      imagesLoaded: number;
    };
  }
}

test.describe("Event Listener Duplication Bug", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({
      page,
      workerId,
    });

    await refreshDatabase({ request, workerId });

    // Update instance to include a custom header script that tracks listener call counts
    // This script simulates what admins might write - a simple event listener
    await updateInstance({
      request,
      workerId,
      updates: {
        customHeaderMode: 1, // ShowCustomHeaderMode.ALWAYS
        customHeader: `
          <script>
            console.log('Custom header script loaded');

            // Track how many times each listener is called
            window.eventListenerCallCounts = window.eventListenerCallCounts || {
              contentLoaded: 0,
              imagesLoaded: 0
            };

            // Simple event listener (what an admin might write)
            window.addEventListener('elevator:static-content-page:content-loaded', (event) => {
              window.eventListenerCallCounts.contentLoaded++;
              console.log('CONTENT_LOADED listener called, count:', window.eventListenerCallCounts.contentLoaded);
            });

            window.addEventListener('elevator:static-content-page:images-loaded', (event) => {
              window.eventListenerCallCounts.imagesLoaded++;
              console.log('IMAGES_LOADED listener called, count:', window.eventListenerCallCounts.imagesLoaded);
            });
          </script>
        `,
      },
    });

    await loginUser({ request, page, workerId });
  });

  test("should NOT duplicate event listeners when navigating between different page types", async ({
    page,
  }) => {
    const getCallCounts = async () => {
      return page.evaluate(() => window.eventListenerCallCounts);
    };

    // Enable console logging for debugging
    page.on("console", (msg) => console.log("BROWSER:", msg.text()));

    // navigate to HomePage
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Elevator Home Page" })
    ).toBeVisible();

    // Wait for both events to fire on HomePage
    await page.waitForTimeout(2000);

    // Each listener should have been called once
    expect(await getCallCounts()).toEqual({
      contentLoaded: 1,
      imagesLoaded: 1,
    });

    // Find menu toggle button or clickable menu element
    const menuToggle = page.getByRole("button", { name: "Toggle main menu" });

    // Ensure the menu toggle is visible
    await expect(menuToggle).toBeVisible();
    await menuToggle.click();

    const menu = page.locator("#app-menu-navigation");
    await expect(menu).toContainText("About");

    // Navigate to About static page
    const aboutLink = menu.getByText("About");
    await expect(aboutLink).toBeVisible();
    await aboutLink.click();

    // Wait for both events
    await page.waitForTimeout(2000);

    // each listener should be called once more (not duplicated)
    expect(await getCallCounts()).toEqual({
      contentLoaded: 2,
      imagesLoaded: 2,
    });

    // now navigate to another static page with images
    // i.e. the page component doesn't change, but we should
    // still see exactly one additional call per listener
    // Find menu toggle button or clickable menu element
    await menuToggle.click();
    const pageWithImagesLink = menu.getByText("Test Page with Broken Images");
    await expect(pageWithImagesLink).toBeVisible();
    await pageWithImagesLink.click();

    // Wait for both events to fire
    await page.waitForTimeout(2000);

    // Check call counts

    // each listener should be called once more (not duplicated)
    expect(await getCallCounts()).toEqual({
      contentLoaded: 3,
      imagesLoaded: 3,
    });

    // now back to homepage
    await page.getByRole("link", { name: "defaultinstance" }).click();

    await page.waitForTimeout(2000);

    // each listener should be called once more (not duplicated)
    expect(await getCallCounts()).toEqual({
      contentLoaded: 4,
      imagesLoaded: 4,
    });
  });
});
