import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, refreshDatabase, loginUser } from "../setup";

const KNOWN_ASSET_ID = "6875871d4eb080a4880a0f44";
// This is the firstFileHandlerId for the seed asset — the ID used in the
// getEmbedAsJson API call when the download button is clicked.
const KNOWN_FILE_HANDLER_ID = "687587494eb080a4880a0f46";

/**
 * Builds a mock FileDownloadResponse with a mix of downloadable
 * and non-downloadable file types. This simulates a DICOM file
 * whose derivatives are not downloadable.
 */
function makeMockDownloadResponse(filename: string) {
  const makeEntry = (
    filetype: string,
    ready: boolean,
    downloadable: boolean,
  ) => ({
    storageClass: "local",
    originalFilename: filename,
    path: `/files/${KNOWN_FILE_HANDLER_ID}/${filetype}`,
    derivativeType: filetype,
    metadata: [],
    basePath: "/files",
    baseWebPath: "/files",
    ready,
    forcedMimeType: null,
    localAsset: null,
    storageKey: `${KNOWN_FILE_HANDLER_ID}_${filetype}`,
    downloadable,
  });

  return {
    original: makeEntry("original", true, true),
    thumbnail: makeEntry("thumbnail", true, true),
    // DICOM-like: ready but NOT downloadable
    dicom: makeEntry("dicom", true, false),
    screen: makeEntry("screen", true, false),
  };
}

test.describe("DownloadFileButton: non-downloadable file filter", () => {
  test.beforeEach(async ({ page, request }) => {
    await page.route("**/arcgis.com/**", (route) => route.abort());
    await page.route("**/basemaps-api.arcgis.com/**", (route) => route.abort());

    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });
  });

  test("hides non-downloadable file types from the download menu", async ({
    page,
  }) => {
    // Intercept the download info API to return a mix of downloadable / non-downloadable
    await page.route(
      `**/asset/getEmbedAsJson/${KNOWN_FILE_HANDLER_ID}/**`,
      (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(makeMockDownloadResponse("scan.dcm")),
        });
      },
    );

    await page.goto(`/asset/viewAsset/${KNOWN_ASSET_ID}`);

    // Click the download button to open the download modal
    const downloadButton = page.getByRole("button", { name: "Download File" });
    await expect(downloadButton).toBeVisible({ timeout: 10000 });
    await downloadButton.click();

    // Wait for the modal to appear (it doesn't have role="dialog", find by heading)
    const modalHeading = page.getByRole("heading", { name: "File Downloads" });
    await expect(modalHeading).toBeVisible({ timeout: 5000 });

    // Scope assertions to the modal container
    const modal = page.locator(".modal").filter({ has: modalHeading });

    // Wait for download info to load (links appear)
    await expect(modal.getByText("original")).toBeVisible({ timeout: 5000 });

    // "thumbnail" is downloadable — should be visible
    await expect(modal.getByText("thumbnail")).toBeVisible();

    // "dicom" and "screen" are NOT downloadable — should be hidden
    await expect(modal.getByText("dicom")).not.toBeVisible();
    await expect(modal.getByText("screen")).not.toBeVisible();
  });
});
