import { test, expect } from "@playwright/test";
import {
  setupWorkerHTTPHeader,
  loginUser,
  refreshDatabase,
  startCountingAssetRefetches,
  waitForSaveToLand,
} from "../../setup";

// Asset 1 from the mock seed data
const ASSET_1_ID = "6875871d4eb080a4880a0f44";

test.describe("a save settles the editor", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });
  });

  test("edits come back clean after one save reshaped by the server", async ({
    page,
  }) => {
    test.setTimeout(30_000);
    const countAssetRefetches = startCountingAssetRefetches(page);

    await page.goto(`/assetManager/editAsset/${ASSET_1_ID}`);
    const titleField = page.getByLabel(/title/i).first();
    await expect(titleField).toHaveValue("Asset 1");

    await titleField.fill("Asset 1, settled");
    // the server stores availableAfter as a DateTime and echoes it in php
    // shape, not as the yyyy-mm-dd string the editor sent
    await page.getByLabel("Available After").fill("2030-03-01");

    const refetchesBeforeSave = countAssetRefetches();
    await page.getByRole("button", { name: "Save" }).click();
    await waitForSaveToLand(page, refetchesBeforeSave, countAssetRefetches);

    await expect(page.getByText("No unsaved changes")).toBeVisible();

    await page.reload();
    await expect(titleField).toHaveValue("Asset 1, settled");
    await expect(page.getByLabel("Available After")).toHaveValue("2030-03-01");
  });
});
