import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";
import mockServerConfig from "../../mock-server/config";

const MOCK_SERVER_BASE = `${mockServerConfig.ORIGIN}:${mockServerConfig.PORT}`;
const SEED_ASSET_ID = "6875871d4eb080a4880a0f44"; // Asset 1 from seed data

test.describe("Trash and Restore", () => {
  let workerId: string;

  test.beforeEach(async ({ page, request }) => {
    workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });
  });

  test("deleted asset appears in trash tab and can be restored", async ({
    page,
    request,
  }) => {
    // --- Delete a seed asset via API ---
    const deleteResp = await request.delete(
      `${MOCK_SERVER_BASE}/defaultinstance/assetManager/deleteAsset/${SEED_ASSET_ID}/true`,
      { headers: { "x-worker-id": workerId } }
    );
    expect(deleteResp.status()).toBe(204);

    // --- Navigate to All My Assets, switch to Trash ---
    await page.goto("/assetManager/userAssets?tab=trash");
    await expect(page.getByText("Asset 1")).toBeVisible();

    // --- Click Restore (one-click, no modal) ---
    const trashRow = page.locator("tr", { hasText: "Asset 1" });
    await trashRow.getByRole("button", { name: "Restore" }).click();

    // --- Toast should confirm restore ---
    await expect(page.getByText("restored.")).toBeVisible();

    // --- Asset should disappear from trash table ---
    await expect(
      page.locator("tbody").getByText("Asset 1")
    ).not.toBeVisible();

    // --- Verify asset is accessible again ---
    await page.goto(`/assetManager/editAsset/${SEED_ASSET_ID}`);
    const titleField = page.getByLabel(/title/i).first();
    await expect(titleField).toHaveValue("Asset 1");
  });

  test("delete via UI shows confirm dialog, then moves asset to trash", async ({
    page,
  }) => {
    // --- Navigate to All My Assets ---
    await page.goto("/assetManager/userAssets");

    // --- Grab the title of the first asset in the table ---
    const firstRow = page.locator("tbody tr").first();
    const assetTitle = await firstRow.locator("td").nth(2).textContent();

    // --- Click Delete — first delete shows confirm dialog ---
    await firstRow.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("Move to Trash?")).toBeVisible();
    await page.getByRole("button", { name: "Move to Trash" }).click();

    // --- Toast confirms deletion ---
    await expect(page.getByText("moved to trash.")).toBeVisible();

    // --- Asset gone from My Assets ---
    await expect(
      page.getByText(assetTitle!, { exact: true })
    ).not.toBeVisible();

    // --- Asset appears in Trash tab ---
    await page.getByText(/Trash/i).first().click();
    await expect(page.getByText(assetTitle!)).toBeVisible();
  });

  test("restore shows toast and moves asset back to My Assets", async ({
    page,
    request,
  }) => {
    // --- Delete via API first ---
    const deleteResp = await request.delete(
      `${MOCK_SERVER_BASE}/defaultinstance/assetManager/deleteAsset/${SEED_ASSET_ID}/true`,
      { headers: { "x-worker-id": workerId } }
    );
    expect(deleteResp.status()).toBe(204);

    // --- Navigate to trash ---
    await page.goto("/assetManager/userAssets?tab=trash");
    await expect(page.getByText("Asset 1")).toBeVisible();

    // --- Restore ---
    const trashRow = page.locator("tr", { hasText: "Asset 1" });
    await trashRow.getByRole("button", { name: "Restore" }).click();

    // --- Toast confirms restore ---
    await expect(page.getByText("restored.")).toBeVisible();

    // --- Asset gone from trash ---
    await expect(
      page.locator("tr", { hasText: "Asset 1" })
    ).not.toBeVisible();
  });
});
