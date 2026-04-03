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
    test("iframe has a title attribute", async ({ page }) => {
      await page.goto(`/asset/viewAsset/${KNOWN_ASSET_ID}`);

      const iframe = page.locator(".object-viewer__iframe");
      await expect(iframe).toBeVisible();
      await expect(iframe).toHaveAttribute("title");
    });

    test("iframe title uses fileDescription when available", async ({
      page,
    }) => {
      await page.goto(`/asset/viewAsset/${KNOWN_ASSET_ID}`);

      const iframe = page.locator(".object-viewer__iframe");
      await expect(iframe).toHaveAttribute("title", "file.txt");
    });
  });

  test.describe("ShareButton embed snippet", () => {
    test("embed snippet includes a title attribute", async ({ page }) => {
      await page.goto(`/asset/viewAsset/${KNOWN_ASSET_ID}`);

      // Open share modal — the share button is inside ObjectDetailsPanel
      await page.getByRole("button", { name: "Object Details" }).click();
      await page.getByRole("button", { name: "Share" }).click();

      const embedTextbox = page.getByRole("textbox", { name: "Embed" });
      await expect(embedTextbox).toBeVisible();
      await expect(embedTextbox).toHaveValue(/title="/);
    });
  });
});
