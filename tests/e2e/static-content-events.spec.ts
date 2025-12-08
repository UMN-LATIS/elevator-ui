import { test, expect } from "@playwright/test";
import {
  setupWorkerHTTPHeader,
  loginUser,
  refreshDatabase,
  updateInstance,
} from "../setup";

test.describe("Static Content Page - Custom Events", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({
      page,
      workerId,
    });

    // Refresh the database for this worker
    await refreshDatabase({ request, workerId });

    // Update instance to include a custom header script that listens for events
    // IMPORTANT: Do this BEFORE loginUser so the instance data is updated
    // before the Vue app initializes
    await updateInstance({
      request,
      workerId,
      updates: {
        customHeaderMode: 1, // ShowCustomHeaderMode.ALWAYS
        customHeader: `
          <script>
            console.log('Custom header script loaded');
            // Listen for the static content page loaded event
            window.addEventListener('elevator:static-content-page:content-loaded', (event) => {
              const { pageId } = event.detail;
              console.log('Static content page loaded:', pageId);

              // Count images in the static content
              const container = document.querySelector('.static-content-page__content');
              const images = container ? container.querySelectorAll('img') : [];

              // Add a test element we can assert against
              const testEl = document.createElement('div');
              testEl.id = 'test-event-received';
              testEl.textContent = \`images in static content = \${images.length}\`;
              document.querySelector('#app h1').before(testEl);
            });
          </script>
        `,
      },
    });

    // Login user AFTER updating instance
    await loginUser({ request, page, workerId });
  });

  test("emits CONTENT_LOADED event when page renders", async ({ page }) => {
    // Navigate to the "About" page (pageId = 2, which has 2 images)
    await page.goto("/page/view/2");

    // Wait for the heading to ensure page is loaded
    await expect(
      page.getByRole("heading", { name: "About Elevator" })
    ).toBeVisible();

    // Wait for the test element to appear (proves the event was fired)
    const testElement = page.locator("#test-event-received");
    await expect(testElement).toBeVisible();

    // Verify the correct image count
    await expect(testElement).toHaveText("images in static content = 2");
  });

  test("emits event for different pages with different image counts", async ({
    page,
  }) => {
    // Navigate to the "Home Page" (pageId = 1, which also has 2 images)
    await page.goto("/page/view/1");

    // Wait for the heading
    await expect(
      page.getByRole("heading", { name: "Elevator Home Page" })
    ).toBeVisible();

    // Verify event was fired with correct count
    const testElement = page.locator("#test-event-received");
    await expect(testElement).toBeVisible();
    await expect(testElement).toHaveText("images in static content = 2");
  });
});
