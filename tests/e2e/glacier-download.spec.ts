import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, refreshDatabase, loginUser } from "../setup";

test.describe("Glacier original download (#546)", () => {
  test.beforeEach(async ({ page, request }) => {
    // Block ArcGIS requests (matches other e2e specs)
    await page.route("**/arcgis.com/**", (route) => route.abort());
    await page.route("**/basemaps-api.arcgis.com/**", (route) => route.abort());

    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });
  });

  test("shows a restore modal instead of saving the Glacier restore HTML", async ({
    page,
  }) => {
    await page.goto("/asset/viewAsset/glacier_asset_001");

    // Open the download menu and confirm the original is offered.
    await page.getByRole("button", { name: "Download File" }).click();
    const originalLink = page.getByRole("link", { name: /original/i });
    await expect(originalLink).toBeVisible();

    // Clicking the original of a Glacier-archived file must NOT trigger a file
    // download (the restore HTML). Capture any download that starts.
    const downloadPromise = page
      .waitForEvent("download", { timeout: 4000 })
      .catch(() => null);

    await originalLink.click();

    const download = await downloadPromise;
    expect(
      download,
      "downloading a Glacier-archived original must not save the restore HTML as a file"
    ).toBeNull();

    // Instead, a modal should explain the file is being restored from Glacier
    // (mirrors the legacy "Give us a moment" page). Each download button renders
    // its own (hidden) modal, so target the one that's actually open.
    await expect(
      page
        .getByRole("heading", { name: "Give us a moment" })
        .filter({ visible: true }),
      "a modal should explain the original is being restored from Glacier"
    ).toBeVisible();
  });
});
