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

    // Our page components dispatch custom DOM events (content-loaded,
    // images-loaded) that admins can hook into via custom header scripts.
    // If a component sets up an event dispatcher on mount but doesn't tear
    // it down on navigation, dispatchers accumulate — after visiting 3 pages,
    // the next navigation fires the event 3 times instead of once.
    //
    // To detect that, we inject a custom header script (like an admin would)
    // that adds a single listener for each event and counts how many times
    // it's called. The listener is added once and stays alive across SPA
    // navigations. If dispatchers are leaking, the count will jump by more
    // than 1 per navigation.
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
    // create a helper to use `expect.poll` to wait for a value
    // which is more reliable than a fixed timeout in CI
    const pollUntil = async (
      fn: () => number,
      expectedValue: number,
      timeout = 5000
    ) => expect.poll(() => page.evaluate(fn), { timeout }).toBe(expectedValue);

    // Enable console logging for debugging
    page.on("console", (msg) => console.log("BROWSER:", msg.text()));

    // navigate to HomePage
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Elevator Home Page" })
    ).toBeVisible();

    // wait until contentLoaded gets called once
    await pollUntil(() => window.eventListenerCallCounts.imagesLoaded, 1);

    // each event should have been dispatched exactly once
    expect(await page.evaluate(() => window.eventListenerCallCounts)).toEqual({
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

    await pollUntil(() => window.eventListenerCallCounts.imagesLoaded, 2);

    // exactly +1, not growing — no leaked dispatchers
    expect(await page.evaluate(() => window.eventListenerCallCounts)).toEqual({
      contentLoaded: 2,
      imagesLoaded: 2,
    });

    // Navigate to a different static page. Both About and this page use the
    // same Vue component (StaticContentPage), so Vue reuses it instead of
    // unmounting. This tests that cleanup works even without an unmount.
    await menuToggle.click();
    const pageWithImagesLink = menu.getByText("Test Page with Broken Images");
    await expect(pageWithImagesLink).toBeVisible();
    await pageWithImagesLink.click();

    await pollUntil(() => window.eventListenerCallCounts.imagesLoaded, 3);

    // exactly +1, not growing — no leaked dispatchers
    expect(await page.evaluate(() => window.eventListenerCallCounts)).toEqual({
      contentLoaded: 3,
      imagesLoaded: 3,
    });

    // now back to homepage
    await page.getByRole("link", { name: "defaultinstance" }).click();

    await pollUntil(() => window.eventListenerCallCounts.imagesLoaded, 4);

    // exactly +1, not growing — no leaked dispatchers
    expect(await page.evaluate(() => window.eventListenerCallCounts)).toEqual({
      contentLoaded: 4,
      imagesLoaded: 4,
    });
  });
});
