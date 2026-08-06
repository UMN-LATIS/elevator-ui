import { test, expect } from "@playwright/test";
import { Buffer } from "node:buffer";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";

const SAVE_ROUTE = "**/assetManager/submission/**";

test.describe("an upload whose auto-save fails", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });

    await page.goto("/assetManager/addAsset");
    await page.getByLabel("Template").selectOption({ label: "Some Fields" });
    await page.getByLabel("Collection").selectOption({ index: 1 });
    await page.getByRole("button", { name: "Continue" }).click();
  });

  test("tells the user the asset was not saved", async ({ page }) => {
    test.setTimeout(30_000);

    // 404 rather than 500, because vue-query retries 500s and the backoff
    // outlives the assertion
    await page.route(SAVE_ROUTE, async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ error: "not found" }),
      });
    });

    await page.getByLabel(/title/i).first().fill("Upload that cannot save");

    const chooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "browse files" }).click();
    const chooser = await chooserPromise;
    await chooser.setFiles({
      name: "photo.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("some bytes"),
    });

    // the upload itself succeeds and the save it triggers does not, which
    // leaves the file attached to an asset the server never stored
    await expect(page.getByText(/failed to save/i)).toBeVisible();
  });
});
