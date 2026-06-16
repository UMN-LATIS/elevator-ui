import { test, expect, type Page } from "@playwright/test";
import { setupWorkerHTTPHeader, refreshDatabase, loginUser } from "../setup";
import mockServerConfig from "../../mock-server/config";

const MOCK_SERVER_BASE = `${mockServerConfig.ORIGIN}:${mockServerConfig.PORT}`;

// glacier_asset_001 holds a single original (goldy-face_001) that is cold in
// Glacier, so its /status endpoint reports "archived". See mock-server/db.
const GLACIER_ASSET_ID = "glacier_asset_001";
const GLACIER_FILE_ID = "goldy-face_001";

const STATUS_ROUTE = `**/fileManager/getOriginal/${GLACIER_FILE_ID}/status`;

// Stub the pollable archive-status endpoint with a fixed response. The
// DownloadFileButton drives its whole original-file UI off this query, so
// stubbing it lets each test pin a single state without seeding S3.
async function stubStatus(
  page: Page,
  status: number,
  body: Record<string, unknown>
) {
  await page.route(STATUS_ROUTE, (route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    })
  );
}

// Open the download modal for the glacier asset and return the modal locator.
async function openDownloadModal(page: Page) {
  await page.goto(`/asset/viewAsset/${GLACIER_ASSET_ID}`);

  const downloadButton = page.getByRole("button", { name: "Download File" });
  await expect(downloadButton).toBeVisible({ timeout: 10000 });
  await downloadButton.click();

  const heading = page.getByRole("heading", { name: "File Downloads" });
  await expect(heading).toBeVisible({ timeout: 5000 });

  return page.locator(".modal").filter({ has: heading });
}

test.describe("DownloadFileButton: original archive states", () => {
  test.beforeEach(async ({ page, request }) => {
    await page.route("**/arcgis.com/**", (route) => route.abort());
    await page.route("**/basemaps-api.arcgis.com/**", (route) => route.abort());

    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });
  });

  test("archived original offers Restore, not a download link", async ({
    page,
  }) => {
    // No stub: the seed file is cold in Glacier, so /status reports "archived".
    const modal = await openDownloadModal(page);

    await expect(
      modal.getByRole("button", { name: "Restore Original" })
    ).toBeVisible({ timeout: 5000 });
    await expect(modal.getByText("The original is archived")).toBeVisible();

    // While archived there must be no direct link into the download action —
    // that is exactly what would trip the 409. See #546.
    await expect(modal.getByRole("link", { name: "Original" })).toHaveCount(0);
  });

  test("requesting a restore swaps in the Restoring state", async ({ page }) => {
    const modal = await openDownloadModal(page);

    await modal.getByRole("button", { name: "Restore Original" }).click();

    await expect(modal.getByText("Restoring Original")).toBeVisible({
      timeout: 5000,
    });
    await expect(modal.getByText(/email you when it's ready/i)).toBeVisible();
  });

  test("downloadable original links straight to the download action", async ({
    page,
  }) => {
    await stubStatus(page, 200, { status: "downloadable" });

    const modal = await openDownloadModal(page);

    const originalLink = modal.getByRole("link", { name: "Original" });
    await expect(originalLink).toBeVisible({ timeout: 5000 });
    await expect(originalLink).toHaveAttribute(
      "href",
      new RegExp(`/fileManager/getOriginal/${GLACIER_FILE_ID}/download$`)
    );
  });

  test("a missing original surfaces a support message", async ({ page }) => {
    await stubStatus(page, 404, { error: "unknownFile" });

    const modal = await openDownloadModal(page);

    await expect(
      modal.getByText(
        "The original file is missing from storage. Please contact support."
      )
    ).toBeVisible({ timeout: 5000 });
  });

  test("the download action 409s for an archived original", async ({
    request,
  }) => {
    // Contract check that the mock mirrors FileManager::getOriginal(): the new
    // download action must refuse to stream a cold file rather than 200 with
    // the wrong bytes. This is the backstop the button's status gate relies on.
    const workerId = test.info().workerIndex.toString();

    const res = await request.get(
      `${MOCK_SERVER_BASE}/defaultinstance/fileManager/getOriginal/${GLACIER_FILE_ID}/download`,
      { headers: { "x-worker-id": workerId } }
    );

    expect(res.status()).toBe(409);
    expect((await res.json()).error).toBe("fileArchived");
  });
});
