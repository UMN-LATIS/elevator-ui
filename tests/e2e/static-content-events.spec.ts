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
        useCustomHeader: 1, // ShowCustomHeaderMode.ALWAYS
        customHeaderText: `
          <script>
            console.log('Custom header script loaded');
            // Listen for the static content page loaded event
            window.addEventListener('elevator:static-content-page:content-loaded', (event) => {
              const { pageId } = event.detail;
              console.log('Static content page loaded:', pageId);

              // Count images in the static content
              const container = document.querySelector('.static-content-page__content');
              const images = container ? container.querySelectorAll('img') : [];

              // Remove old test element if it exists
              const oldTestEl = document.getElementById('test-event-received');
              if (oldTestEl) oldTestEl.remove();

              // Add a test element we can assert against
              const testEl = document.createElement('div');
              testEl.id = 'test-event-received';
              testEl.setAttribute('data-page-id', pageId.toString());
              testEl.textContent = \`page \${pageId}: images in static content = \${images.length}\`;
              document.body.appendChild(testEl);
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

    // Verify the correct image count and page ID
    await expect(testElement).toHaveAttribute("data-page-id", "2");
    await expect(testElement).toHaveText(
      "page 2: images in static content = 2"
    );
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
    await expect(testElement).toHaveText(
      "page 1: images in static content = 2"
    );
  });

  test("emits CONTENT_LOADED event on each page navigation", async ({
    page,
  }) => {
    // Navigate to page 1 (Home Page - 2 images)
    await page.goto("/page/view/1");

    await expect(
      page.getByRole("heading", { name: "Elevator Home Page" })
    ).toBeVisible();

    // Verify first event fired with pageId = 1
    const testElement = page.locator("#test-event-received");
    await expect(testElement).toBeVisible();
    await expect(testElement).toHaveAttribute("data-page-id", "1");
    await expect(testElement).toHaveText(
      "page 1: images in static content = 2"
    );

    // Navigate to page 2 (About - 2 images)
    await page.goto("/page/view/2");

    await expect(
      page.getByRole("heading", { name: "About Elevator" })
    ).toBeVisible();

    // Verify event fired again with pageId = 2
    await expect(testElement).toHaveAttribute("data-page-id", "2");
    await expect(testElement).toHaveText(
      "page 2: images in static content = 2"
    );

    // Navigate to page 3 (Broken Images - 3 images)
    await page.goto("/page/view/3");

    await expect(
      page.getByRole("heading", { name: "Test Page with Broken Images" })
    ).toBeVisible();

    // Verify event fired again with pageId = 3
    await expect(testElement).toHaveAttribute("data-page-id", "3");
    await expect(testElement).toHaveText(
      "page 3: images in static content = 3"
    );

    // Navigate back to page 1 to verify it works in reverse
    await page.goto("/page/view/1");

    await expect(
      page.getByRole("heading", { name: "Elevator Home Page" })
    ).toBeVisible();

    // Verify event fired again with pageId = 1
    await expect(testElement).toHaveAttribute("data-page-id", "1");
    await expect(testElement).toHaveText(
      "page 1: images in static content = 2"
    );
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
        useCustomHeader: 1, // ShowCustomHeaderMode.ALWAYS
        customHeaderText: `
          <script>
            // Track start time when script loads
            const pageLoadStartTime = Date.now();

            // Listen for the images loaded event
            window.addEventListener('elevator:static-content-page:images-loaded', (event) => {
              const { pageId, images } = event.detail;
              const eventTime = Date.now() - pageLoadStartTime;

              // Check if all images are actually loaded
              const allLoaded = images.every(img => img.complete && img.naturalWidth > 0);
              const loadedCount = images.filter(img => img.complete && img.naturalWidth > 0).length;

              // Remove old test element if it exists
              const oldTestEl = document.getElementById('test-images-loaded');
              if (oldTestEl) oldTestEl.remove();

              // Add test element with results
              const testEl = document.createElement('div');
              testEl.id = 'test-images-loaded';
              testEl.setAttribute('data-all-loaded', allLoaded.toString());
              testEl.setAttribute('data-loaded-count', loadedCount.toString());
              testEl.setAttribute('data-total-count', images.length.toString());
              testEl.setAttribute('data-event-time', eventTime.toString());
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
      page.getByRole("heading", { name: "Test Page with Broken Images" })
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

  test("emits IMAGES_LOADED event after timeout when image takes too long", async ({
    page,
  }) => {
    test.setTimeout(20000); // Increase test timeout to 20 seconds

    // Listen for console messages for debugging
    page.on("console", (msg) => console.log("BROWSER:", msg.text()));

    // Navigate to page 4 which has 1 fast image and 1 slow image (15s delay)
    // The timeout in onAllImagesLoaded is 10 seconds
    await page.goto("/page/view/4");

    await expect(
      page.getByRole("heading", { name: "Page with Timeout Test" })
    ).toBeVisible();

    // Wait for IMAGES_LOADED event - should fire after ~10 seconds (timeout)
    const testElement = page.locator("#test-images-loaded");
    await expect(testElement).toBeVisible({ timeout: 15000 });

    // Get the actual time when the event fired (stored in data attribute)
    const eventTime = await testElement.getAttribute("data-event-time").then(val => parseInt(val || "0", 10));

    // Verify the event fired around the timeout period (10 seconds ± 2 seconds)
    // Not before images finish loading naturally (15 seconds)
    expect(eventTime).toBeGreaterThan(8000); // At least 8 seconds
    expect(eventTime).toBeLessThan(13000); // Less than 13 seconds (timeout + buffer)

    // Verify the event fired with both images in the payload
    await expect(testElement).toHaveAttribute("data-total-count", "2");

    // Only the fast image should be loaded when timeout fires
    await expect(testElement).toHaveAttribute("data-loaded-count", "1");

    // Not all images loaded due to timeout
    await expect(testElement).toHaveAttribute("data-all-loaded", "false");

    // Verify the text reflects timeout state
    await expect(testElement).toContainText(
      "images loaded: 1/2, all complete: false"
    );
  });
});
