import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";

// Asset 1 from seed data — has fileDescription "file.txt" and title "Asset 1"
const KNOWN_ASSET_ID = "6875871d4eb080a4880a0f44";

test.describe("Iframe accessibility: title attributes", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId });
  });

  test.describe("ObjectViewer on asset view page", () => {
    test("iframe has a non-empty title attribute", async ({ page }) => {
      await page.goto(`/asset/viewAsset/${KNOWN_ASSET_ID}`);

      const iframe = page.locator(".object-viewer__iframe");
      await expect(iframe).toBeVisible();

      const title = await iframe.getAttribute("title");
      expect(title).toBeTruthy();
      expect(title!.length).toBeGreaterThan(0);
    });

    test("iframe title is not the generic fallback", async ({ page }) => {
      // Wait for the asset API response so the store populates
      const [response] = await Promise.all([
        page.waitForResponse((r) =>
          r.url().includes(`/asset/viewAsset/${KNOWN_ASSET_ID}/true`)
        ),
        page.goto(`/asset/viewAsset/${KNOWN_ASSET_ID}`),
      ]);
      expect(response.status()).toBe(200);

      const iframe = page.locator(".object-viewer__iframe");
      const title = await iframe.getAttribute("title");
      expect(title).toBeTruthy();
      // Should use fileDescription or asset title, not the generic default
      expect(title).not.toBe("Asset viewer");
    });
  });

  test.describe("ShareButton embed snippet", () => {
    test("embed snippet includes a title attribute", async ({ page }) => {
      // Use the drawer page where ShareButton is always visible
      await page.goto("/drawers/viewDrawer/1?resultsView=map");

      await page.getByRole("button", { name: "Share" }).click();

      const embedTextbox = page.getByRole("textbox", { name: "Embed" });
      await expect(embedTextbox).toBeVisible();
      await expect(embedTextbox).toHaveValue(/title="/);
    });
  });
});
