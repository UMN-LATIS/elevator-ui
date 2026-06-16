import { test, expect, type Page } from "@playwright/test";
import { setupWorkerHTTPHeader, refreshDatabase, loginUser } from "../setup";
import mockServerConfig from "../../mock-server/config";

const MOCK_SERVER_BASE = `${mockServerConfig.ORIGIN}:${mockServerConfig.PORT}`;

// glacier_mixed_asset_001 is a multi-file upload widget (so the "More actions"
// menu appears): a .tif original cold in Glacier, plus warm originals that are
// downloadable right now (a .png and a few synthetic .svgs). The archived .tif
// is listed first, so its restore is observable before goldy-M (the first warm
// original) streams down. See mock-server/db.
const MIXED_ASSET_ID = "glacier_mixed_asset_001";
const WARM_FILE_ID = "goldy-M";
const ARCHIVED_FILE_ID = "glacier_file_001";

const STATUS_ROUTE = "**/fileManager/getOriginal/*/status";
const restoreRoute = (fileId: string) =>
  new RegExp(`/fileManager/getOriginal/${fileId}/restore$`);

// Pin every original's archive-status query to one fixed response, the way
// download-file-original.spec does — lets a test put the whole batch into a
// single state without seeding S3.
async function stubAllStatus(
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

// Open the upload widget's "More actions" menu and click "Download All
// Originals". The menu does a permission check on open, so wait for the item.
async function clickDownloadAllOriginals(page: Page) {
  await page.goto(`/asset/viewAsset/${MIXED_ASSET_ID}`);

  const moreActions = page.getByRole("button", { name: "More actions" });
  await expect(moreActions).toBeVisible({ timeout: 10000 });
  await moreActions.click();

  const downloadOriginals = page.getByText("Download All Originals");
  await expect(downloadOriginals).toBeVisible({ timeout: 5000 });
  await downloadOriginals.click();
}

// Count every restore POST the batch fires, so a test can assert which files
// were (or weren't) queued for a thaw.
function trackRestorePosts(page: Page): string[] {
  const urls: string[] = [];
  page.on("request", (req) => {
    if (
      req.method() === "POST" &&
      /\/fileManager\/getOriginal\/[^/]+\/restore$/.test(req.url())
    ) {
      urls.push(req.url());
    }
  });
  return urls;
}

test.describe("UploadWidget: Download All Originals across archive states", () => {
  test.beforeEach(async ({ page, request }) => {
    await page.route("**/arcgis.com/**", (route) => route.abort());
    await page.route("**/basemaps-api.arcgis.com/**", (route) => route.abort());

    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });
  });

  test("downloads the warm original and queues a restore for the archived one", async ({
    page,
  }) => {
    // No status stub: the .tif reports archived, the warm originals report
    // downloadable — the real mixed-state batch. The archived original is first,
    // so we can assert its restore and the first warm download early without
    // waiting out the trailing warm .svgs (each settles ~2s, serially).
    test.setTimeout(25000);

    const restorePosts = trackRestorePosts(page);
    const downloadPromise = page.waitForEvent("download", { timeout: 15000 });

    await clickDownloadAllOriginals(page);

    // Archived original first: not downloaded, but queued for a restore with its
    // own named toast promising an email. (All restore toasts say "email you",
    // so match the tif's specifically.)
    await expect(
      page.getByText(/restoring glacier-photo\.tif.*email you/i)
    ).toBeVisible({ timeout: 15000 });
    expect(
      restorePosts.some((u) => restoreRoute(ARCHIVED_FILE_ID).test(u))
    ).toBe(true);

    // The first warm original then streams straight down, named in its own toast.
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.png$/);
    await expect(
      page.getByText(/download of goldy-M\.png started/i)
    ).toBeVisible({ timeout: 15000 });

    // The warm original was downloaded, never restored.
    expect(restorePosts.some((u) => restoreRoute(WARM_FILE_ID).test(u))).toBe(
      false
    );
  });

  test("an all-restoring batch re-requests the restore and downloads nothing", async ({
    page,
  }) => {
    // A file already mid-thaw: re-request so the user joins the email queue,
    // mirroring DownloadFileButton. Nothing is downloadable yet.
    await stubAllStatus(page, 200, { status: "restoring" });

    const restorePosts = trackRestorePosts(page);
    const downloads: unknown[] = [];
    page.on("download", (d) => downloads.push(d));

    await clickDownloadAllOriginals(page);

    // Archived original first: re-requested for restore with a named toast that
    // promises an email. (All restore toasts say "email you", so match the tif's
    // specifically.)
    await expect(
      page.getByText(/restoring glacier-photo\.tif.*email you/i)
    ).toBeVisible({ timeout: 15000 });
    expect(
      restorePosts.some((u) => restoreRoute(ARCHIVED_FILE_ID).test(u))
    ).toBe(true);

    // The warm original (next in line) is re-requested too — wait for its
    // restore call, since it fires just after the archived one.
    await expect
      .poll(
        () => restorePosts.some((u) => restoreRoute(WARM_FILE_ID).test(u)),
        {
          timeout: 15000,
        }
      )
      .toBe(true);
    expect(downloads).toHaveLength(0);
  });

  test("a status error shows an error toast and downloads nothing", async ({
    page,
  }) => {
    // Status check fails (forbidden) — never attempt a download or a restore.
    await stubAllStatus(page, 403, { error: "noPermission" });

    const restorePosts = trackRestorePosts(page);
    const downloads: unknown[] = [];
    page.on("download", (d) => downloads.push(d));

    await clickDownloadAllOriginals(page);

    // Each erroring original gets its own named toast. The archived original is
    // processed first; nothing in this batch ever downloads or restores.
    await expect(
      page.getByText(/couldn't check the status of glacier-photo\.tif/i)
    ).toBeVisible({ timeout: 15000 });
    expect(restorePosts).toHaveLength(0);
    expect(downloads).toHaveLength(0);
  });

  test("the archived original has real bytes so a completed restore can download", async ({
    request,
  }) => {
    // Regression guard for a fixture gap found by hand: glacier_file_001 is
    // archived, but once a restore flips it to downloadable its /download must
    // serve real bytes rather than 404 ("File wasn't available on site"). The
    // archive gate sits in front of /download, so probe the bytes through the
    // ungated legacy /getOriginal route instead.
    const workerId = test.info().workerIndex.toString();
    const res = await request.get(
      `${MOCK_SERVER_BASE}/defaultinstance/fileManager/getOriginal/${ARCHIVED_FILE_ID}`,
      { headers: { "x-worker-id": workerId } }
    );

    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/tiff");
  });
});
