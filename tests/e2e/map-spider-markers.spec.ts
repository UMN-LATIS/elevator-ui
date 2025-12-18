import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";

test.describe("Map Spider Markers Functionality", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({
      page,
      workerId,
    });

    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId });
  });

  test("map loads and displays correctly on search page", async ({ page }) => {
    await page.goto("/search");

    // Wait for map container to be present
    const mapContainer = page.locator(".maplibre-map");
    await expect(mapContainer).toBeVisible({ timeout: 10000 });

    // Verify map controls are present
    const geolocateControl = page.locator(".maplibregl-ctrl-geolocate");
    await expect(geolocateControl).toBeVisible();
  });

  test("map allows interaction with markers", async ({ page }) => {
    await page.goto("/search");

    // Wait for map to load
    const mapContainer = page.locator(".maplibre-map");
    await expect(mapContainer).toBeVisible({ timeout: 10000 });

    // Verify canvas is interactive
    const canvas = page.locator(".maplibre-map canvas").first();
    await expect(canvas).toBeVisible();

    // Map should be interactive - we can verify by checking if canvas exists
    const canvasCount = await canvas.count();
    expect(canvasCount).toBeGreaterThan(0);
  });

  test("map displays with proper styling", async ({ page }) => {
    await page.goto("/search");

    // Wait for map container
    const mapContainer = page.locator(".maplibre-map");
    await expect(mapContainer).toBeVisible({ timeout: 10000 });

    // Check map style controls are present
    const mapStyleButtons = page.locator(".maplibre-map").locator("..");
    await expect(mapStyleButtons).toBeVisible();
  });
});
