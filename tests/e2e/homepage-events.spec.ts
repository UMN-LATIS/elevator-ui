import { test, expect } from "@playwright/test";
import {
  setupWorkerHTTPHeader,
  loginUser,
  refreshDatabase,
  updateInstance,
} from "../setup";

test.describe("HomePage - CONTENT_LOADED Event", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({
      page,
      workerId,
    });

    await refreshDatabase({ request, workerId });

    // Update instance with a script that listens for HOME_PAGE events
    await updateInstance({
      request,
      workerId,
      updates: {
        useCustomHeader: 2, // ShowCustomHeaderMode.HOME_PAGE_ONLY
        customHeaderText: `
          <script>
            // Listen for the home page content loaded event
            window.addEventListener('elevator:static-content-page:content-loaded', (event) => {
              const { pageId, featuredAssetId } = event.detail;

              // Add test element to verify event fired
              const testEl = document.createElement('div');
              testEl.id = 'test-content-loaded';
              testEl.setAttribute('data-page-id', pageId?.toString() || 'null');
              testEl.setAttribute('data-featured-asset-id', featuredAssetId || 'null');
              testEl.textContent = \`home page loaded: pageId=\${pageId}, featuredAssetId=\${featuredAssetId}\`;
              document.body.appendChild(testEl);
            });
          </script>
        `,
      },
    });

    await loginUser({ request, page, workerId });
  });

  test("emits CONTENT_LOADED event after page and featured asset load", async ({
    page,
  }) => {
    // Navigate to the homepage
    await page.goto("/");

    // Wait for the home page heading to be visible
    await expect(
      page.getByRole("heading", { name: "Elevator Home Page" })
    ).toBeVisible();

    // Wait for the featured asset section to be visible
    const featuredSection = page.locator(".featured-asset-block");
    await expect(featuredSection).toBeVisible();

    // Wait for the test element (proves CONTENT_LOADED event fired)
    const testElement = page.locator("#test-content-loaded");
    await expect(testElement).toBeVisible();

    // Verify the event includes both homePageId and featuredAssetId
    await expect(testElement).toHaveAttribute("data-page-id", "1");
    await expect(testElement).toHaveAttribute(
      "data-featured-asset-id",
      "687969fd9c90c709c1021d01"
    );

    // Verify the text content
    await expect(testElement).toContainText("pageId=1");
    await expect(testElement).toContainText(
      "featuredAssetId=687969fd9c90c709c1021d01"
    );
  });

  test("CONTENT_LOADED waits for featured asset to load", async ({ page }) => {
    // Navigate to homepage
    await page.goto("/");

    // The event should NOT fire until both page content AND featured asset are ready
    // We can verify this by checking that the featured asset card is rendered
    await expect(page.locator(".featured-asset-block")).toBeVisible();

    // Now the event should have fired
    const testElement = page.locator("#test-content-loaded");
    await expect(testElement).toBeVisible();

    // Verify featured asset ID is in the payload
    await expect(testElement).toHaveAttribute(
      "data-featured-asset-id",
      "687969fd9c90c709c1021d01"
    );
  });
});

test.describe("HomePage - IMAGES_LOADED Event", () => {
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
        useCustomHeader: 2, // ShowCustomHeaderMode.HOME_PAGE_ONLY
        customHeaderText: `
          <script>
            // Track IMAGES_LOADED event (HomePage fires once for all content areas)
            let eventCount = 0;
            let totalImagesFromEvents = 0;
            let totalLoadedFromEvents = 0;

            window.addEventListener('elevator:static-content-page:images-loaded', (event) => {
              eventCount++;
              const { pageId, featuredAssetId, images } = event.detail;

              console.log(\`IMAGES_LOADED event #\${eventCount}: \${images.length} images\`);

              // Check if all images are actually loaded
              const allLoaded = images.every(img => img.complete && img.naturalWidth > 0);
              const loadedCount = images.filter(img => img.complete && img.naturalWidth > 0).length;

              // Accumulate totals from all events
              totalImagesFromEvents += images.length;
              totalLoadedFromEvents += loadedCount;

              // Count images currently in DOM
              const homePageContentImages = document.querySelectorAll('.home-page-content img').length;
              const featuredAssetImages = document.querySelectorAll('.featured-asset-block img').length;

              // Update/create test element (replace on each event)
              let testEl = document.getElementById('test-images-loaded');
              if (!testEl) {
                testEl = document.createElement('div');
                testEl.id = 'test-images-loaded';
                document.body.appendChild(testEl);
              }

              // Store cumulative data
              testEl.setAttribute('data-event-count', eventCount.toString());
              testEl.setAttribute('data-event-total-images', totalImagesFromEvents.toString());
              testEl.setAttribute('data-event-loaded-images', totalLoadedFromEvents.toString());
              testEl.setAttribute('data-last-event-count', images.length.toString());
              testEl.setAttribute('data-last-event-loaded', loadedCount.toString());
              testEl.setAttribute('data-page-id', pageId?.toString() || 'null');
              testEl.setAttribute('data-featured-asset-id', featuredAssetId || 'null');
              testEl.setAttribute('data-home-content-images', homePageContentImages.toString());
              testEl.setAttribute('data-featured-asset-images', featuredAssetImages.toString());
              testEl.textContent = \`Events: \${eventCount}, Total from events: \${totalLoadedFromEvents}/\${totalImagesFromEvents}\`;
            });
          </script>
        `,
      },
    });

    await loginUser({ request, page, workerId });
  });

  test("emits IMAGES_LOADED events for both content areas", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Elevator Home Page" })
    ).toBeVisible();

    const testElement = page.locator("#test-images-loaded");
    await expect(testElement).toBeVisible({ timeout: 15000 });

    // Wait a bit longer to see if a second event fires
    await page.waitForTimeout(2000);

    // Get all the attributes
    const eventCount = await testElement.getAttribute("data-event-count");
    const eventTotalImages = await testElement.getAttribute(
      "data-event-total-images"
    );
    const eventLoadedImages = await testElement.getAttribute(
      "data-event-loaded-images"
    );

    const actualEventCount = parseInt(eventCount || "0");
    const totalFromEvents = parseInt(eventTotalImages || "0");
    const loadedFromEvents = parseInt(eventLoadedImages || "0");

    // Verify only 1 event fired - main content and featured assets
    // must both be loaded before a single event fires
    expect(actualEventCount).toBe(1);

    // Verify we got at least the 2 images from the page content
    // so we might get 2-3 images total depending on timing
    expect(totalFromEvents).toBe(2);
    expect(loadedFromEvents).toBe(2);

    // Verify the event includes the correct IDs
    await expect(testElement).toHaveAttribute("data-page-id", "1");
    await expect(testElement).toHaveAttribute(
      "data-featured-asset-id",
      "687969fd9c90c709c1021d01"
    );
  });
});
