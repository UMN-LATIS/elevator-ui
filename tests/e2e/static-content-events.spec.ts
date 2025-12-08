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

test.describe("Static Content Page - IMAGES_LOADED Event", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({
      page,
      workerId,
    });

    await refreshDatabase({ request, workerId });

    // Update instance with a script that listens for IMAGES_LOADED
    await updateInstance({
      request,
      workerId,
      updates: {
        customHeaderMode: 1, // ShowCustomHeaderMode.ALWAYS
        customHeader: `
          <script>
            // Listen for the images loaded event
            window.addEventListener('elevator:static-content-page:images-loaded', (event) => {
              const { pageId, images } = event.detail;

              // Check if all images are actually loaded
              const allLoaded = images.every(img => img.complete && img.naturalWidth > 0);
              const loadedCount = images.filter(img => img.complete && img.naturalWidth > 0).length;

              // Add test element with results
              const testEl = document.createElement('div');
              testEl.id = 'test-images-loaded';
              testEl.setAttribute('data-all-loaded', allLoaded.toString());
              testEl.setAttribute('data-loaded-count', loadedCount.toString());
              testEl.setAttribute('data-total-count', images.length.toString());
              testEl.textContent = \`images loaded: \${loadedCount}/\${images.length}, all complete: \${allLoaded}\`;
              document.body.appendChild(testEl);
            });
          </script>
        `,
      },
    });

    await loginUser({ request, page, workerId });
  });

  test("emits IMAGES_LOADED event after images are fully loaded", async ({
    page,
  }) => {
    // Navigate to the "About" page (pageId = 2, which has 2 images)
    await page.goto("/page/view/2");

    // Wait for the heading to ensure page is loaded
    await expect(
      page.getByRole("heading", { name: "About Elevator" })
    ).toBeVisible();

    // Wait for the test element (proves IMAGES_LOADED event fired)
    const testElement = page.locator("#test-images-loaded");
    await expect(testElement).toBeVisible({ timeout: 15000 }); // Longer timeout for image loading

    // Verify all images were actually loaded when the event fired
    await expect(testElement).toHaveAttribute("data-all-loaded", "true");
    await expect(testElement).toHaveAttribute("data-loaded-count", "2");
    await expect(testElement).toHaveAttribute("data-total-count", "2");

    // Verify the text content
    await expect(testElement).toContainText(
      "images loaded: 2/2, all complete: true"
    );
  });

  test("handles pages with images that take time to load", async ({ page }) => {
    // Navigate to the "Home Page" (pageId = 1, which also has 2 images)
    await page.goto("/page/view/1");

    await expect(
      page.getByRole("heading", { name: "Elevator Home Page" })
    ).toBeVisible();

    // Wait for IMAGES_LOADED event
    const testElement = page.locator("#test-images-loaded");
    await expect(testElement).toBeVisible({ timeout: 5000 });

    // Verify images were loaded (not just present in DOM)
    await expect(testElement).toHaveAttribute("data-all-loaded", "true");
    await expect(testElement).toHaveText(
      "images loaded: 2/2, all complete: true"
    );
  });

  test("emits IMAGES_LOADED event even when some images fail to load", async ({
    page,
  }) => {
    // Navigate to page 3 which has 1 valid image and 2 broken images
    await page.goto("/page/view/3");

    await expect(
      page.getByRole("heading", { name: "Page with Image Load Errors" })
    ).toBeVisible();

    // Wait for IMAGES_LOADED event (should still fire despite broken images)
    const testElement = page.locator("#test-images-loaded");
    await expect(testElement).toBeVisible({ timeout: 15000 });

    // Verify the event fired with all 3 images in the payload
    await expect(testElement).toHaveAttribute("data-total-count", "3");

    // Verify only 1 image actually loaded successfully
    await expect(testElement).toHaveAttribute("data-loaded-count", "1");

    // Verify not all images loaded (allLoaded should be false)
    await expect(testElement).toHaveAttribute("data-all-loaded", "false");

    // Verify the text reflects the mixed state
    await expect(testElement).toContainText(
      "images loaded: 1/3, all complete: false"
    );
  });
});
