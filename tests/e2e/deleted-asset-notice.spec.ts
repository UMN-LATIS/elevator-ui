import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";
import mockServerConfig from "../../mock-server/config";

const MOCK_SERVER_BASE = `${mockServerConfig.ORIGIN}:${mockServerConfig.PORT}`;
const SEED_ASSET_ID = "6875871d4eb080a4880a0f44"; // Asset 1 from seed data

test.describe("Deleted Asset Notice", () => {
  let workerId: string;

  test.beforeEach(async ({ page, request }) => {
    workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });

    // Delete the asset via API
    const deleteResp = await request.delete(
      `${MOCK_SERVER_BASE}/defaultinstance/assetManager/deleteAsset/${SEED_ASSET_ID}/true`,
      { headers: { "x-worker-id": workerId } }
    );
    expect(deleteResp.status()).toBe(204);
  });

  test("viewAsset page shows deleted notice for a deleted asset", async ({
    page,
  }) => {
    await page.goto(`/asset/viewAsset/${SEED_ASSET_ID}`);

    await expect(page.getByText("Asset Deleted")).toBeVisible();
    await expect(page.getByText("This asset was deleted on")).toBeVisible();
  });

  test("editAsset page shows deleted notice for a deleted asset", async ({
    page,
  }) => {
    await page.goto(`/assetManager/editAsset/${SEED_ASSET_ID}`);

    await expect(page.getByText("Asset Deleted")).toBeVisible();
    await expect(page.getByText("This asset was deleted on")).toBeVisible();
  });

  test("curator can undelete from viewAsset page", async ({ page }) => {
    await page.goto(`/asset/viewAsset/${SEED_ASSET_ID}`);
    await expect(page.getByText("Asset Deleted")).toBeVisible();

    await page.getByRole("button", { name: "Restore" }).click();

    // After restore, the notice should disappear and asset should load
    await expect(page.getByText("Asset Deleted")).not.toBeVisible();
    await expect(page.getByText("restored.")).toBeVisible();
  });

  test("curator can undelete from editAsset page", async ({ page }) => {
    await page.goto(`/assetManager/editAsset/${SEED_ASSET_ID}`);

    await expect(page.getByText("Asset Deleted")).toBeVisible();
    await page.getByRole("button", { name: "Restore" }).click();

    // After restore, the notice should disappear
    await expect(page.getByText("Asset Deleted")).not.toBeVisible();
    await expect(page.getByText("restored.")).toBeVisible();
  });

  test("regular user sees deleted notice without Restore button", async ({
    page,
    request,
  }) => {
    // Re-login as regular user (no canManageAssets permission)
    await loginUser({ request, page, workerId, username: "user" });

    await page.goto(`/asset/viewAsset/${SEED_ASSET_ID}`);

    await expect(page.getByText("Asset Deleted")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Restore" })
    ).not.toBeVisible();
  });
});
