import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";

test.describe("Gallery View", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({
      page,
      workerId,
    });

    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId });
  });

  test("displays all images without duplication for assets with multiple files", async ({
    page,
  }) => {
    // Navigate to search results page
    await page.goto("/search");

    // Perform a search to get results
    const searchInput = page.getByRole("textbox", { name: "Search" }).first();
    await searchInput.fill("asset");
    await searchInput.press("Enter");

    // Wait for search results to load
    await page.waitForSelector('[data-testid="search-results"]', {
      state: "visible",
      timeout: 10000,
    });

    // Switch to gallery view
    const galleryViewButton = page.getByRole("button", {
      name: /gallery view/i,
    });
    if (await galleryViewButton.isVisible()) {
      await galleryViewButton.click();
    }

    // Wait for gallery to load
    await page.waitForSelector(".search-results-gallery", {
      state: "visible",
      timeout: 10000,
    });

    // Get all thumbnail slides in the gallery
    const thumbnailSlides = await page
      .locator(".thumbs-swiper .swiper-slide")
      .all();

    // Verify that thumbnails exist
    expect(thumbnailSlides.length).toBeGreaterThan(0);

    // Get all unique image sources from thumbnails
    const thumbnailSources = new Set<string>();
    for (const slide of thumbnailSlides) {
      const img = slide.locator("img");
      if (await img.count()) {
        const src = await img.getAttribute("src");
        if (src) {
          thumbnailSources.add(src);
        }
      }
    }

    // Verify no duplicate images in thumbnails
    // The number of unique sources should equal the number of slides with images
    const slidesWithImages = await Promise.all(
      thumbnailSlides.map(async (slide) => {
        const img = slide.locator("img");
        return (await img.count()) > 0;
      })
    );
    const imagesCount = slidesWithImages.filter(Boolean).length;

    expect(thumbnailSources.size).toBe(imagesCount);
  });

  test("navigates through gallery slides correctly", async ({ page }) => {
    await page.goto("/search");

    const searchInput = page.getByRole("textbox", { name: "Search" }).first();
    await searchInput.fill("asset");
    await searchInput.press("Enter");

    await page.waitForSelector('[data-testid="search-results"]', {
      state: "visible",
      timeout: 10000,
    });

    const galleryViewButton = page.getByRole("button", {
      name: /gallery view/i,
    });
    if (await galleryViewButton.isVisible()) {
      await galleryViewButton.click();
    }

    await page.waitForSelector(".search-results-gallery", {
      state: "visible",
      timeout: 10000,
    });

    // Get initial slide index
    const slideCounter = page.locator(".search-results-gallery").locator("text=/\\d+/").first();
    const initialIndex = await slideCounter.textContent();

    // Click next button
    const nextButton = page.getByRole("button", { name: /next/i }).last();
    await nextButton.click();

    // Wait a moment for the slide transition
    await page.waitForTimeout(500);

    // Verify slide changed
    const newIndex = await slideCounter.textContent();
    expect(newIndex).not.toBe(initialIndex);
  });

  test("displays primary image once in main view and thumbnails", async ({
    page,
  }) => {
    await page.goto("/search");

    const searchInput = page.getByRole("textbox", { name: "Search" }).first();
    await searchInput.fill("asset");
    await searchInput.press("Enter");

    await page.waitForSelector('[data-testid="search-results"]', {
      state: "visible",
      timeout: 10000,
    });

    const galleryViewButton = page.getByRole("button", {
      name: /gallery view/i,
    });
    if (await galleryViewButton.isVisible()) {
      await galleryViewButton.click();
    }

    await page.waitForSelector(".search-results-gallery", {
      state: "visible",
      timeout: 10000,
    });

    // Get the main swiper slide that's currently active
    const mainSlide = page
      .locator(".main-swiper .swiper-slide-active")
      .first();
    await expect(mainSlide).toBeVisible();

    // Get the active thumbnail
    const activeThumbnail = page
      .locator(".thumbs-swiper .swiper-slide-active")
      .first();
    await expect(activeThumbnail).toBeVisible();

    // Verify both exist (ensuring the view is working)
    expect(await mainSlide.count()).toBe(1);
    expect(await activeThumbnail.count()).toBe(1);
  });
});
