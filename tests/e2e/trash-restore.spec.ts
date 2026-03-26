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

    // --- Click Restore — first restore shows confirm dialog ---
    const trashRow = page.locator("tr", { hasText: "Asset 1" });
    await trashRow.getByRole("button", { name: "Restore" }).click();
    await expect(page.getByText("Restore Asset?")).toBeVisible();
    await page.getByRole("button", { name: "Restore" }).click();

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
    await expect(
      page.locator("tbody").getByText(assetTitle!, { exact: true })
    ).toBeVisible();
  });

  test("rapid deletes: second deleted asset does not reappear after first delete settles", async ({
    page,
  }) => {
    await page.goto("/assetManager/userAssets");
    await page.locator("tbody tr").first().waitFor();

    // Identify the first two assets by title (column index 2)
    const firstTitle = (
      await page.locator("tbody tr").nth(0).locator("td").nth(2).textContent()
    )!.trim();
    const secondTitle = (
      await page.locator("tbody tr").nth(1).locator("td").nth(2).textContent()
    )!.trim();

    // Listen for the userAssets refetch (any GET after the initial load)
    const refetch = page.waitForResponse(
      (r) =>
        r.url().includes("/userAssets/") &&
        r.url().includes("/true") &&
        r.request().method() === "GET"
    );

    // Delete first asset — triggers one-time confirm dialog
    await page
      .locator("tbody tr")
      .first()
      .getByRole("button", { name: "Delete" })
      .click();
    await page.getByRole("button", { name: "Move to Trash" }).click();

    // Wait for first asset to leave the DOM before targeting next row
    await expect(
      page.locator("tbody").getByText(firstTitle, { exact: true })
    ).not.toBeVisible();

    // Delete second asset — no dialog (already confirmed this session)
    await page
      .locator("tbody tr")
      .first()
      .getByRole("button", { name: "Delete" })
      .click();

    // Second asset also removed optimistically
    await expect(
      page.locator("tbody").getByText(secondTitle, { exact: true })
    ).not.toBeVisible();

    // Wait for the refetch to complete.
    // - Guard works: refetch fires after both deletes settle → correct data → pass
    // - Guard missing: refetch fires after first delete → stale data with asset 2 → fail
    // - Guard blocks all refetches: times out → fail
    await refetch;
    // Let Vue render the refetch data
    await page.waitForTimeout(50);

    // Point-in-time check (no auto-retry) — catches the race condition
    expect(
      await page
        .locator("tbody")
        .getByText(secondTitle, { exact: true })
        .isVisible()
    ).toBe(false);
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

    // --- Restore — confirm dialog ---
    const trashRow = page.locator("tr", { hasText: "Asset 1" });
    await trashRow.getByRole("button", { name: "Restore" }).click();
    await expect(page.getByText("Restore Asset?")).toBeVisible();
    await page.getByRole("button", { name: "Restore" }).click();

    // --- Toast confirms restore ---
    await expect(page.getByText("restored.")).toBeVisible();

    // --- Asset gone from trash ---
    await expect(
      page.locator("tr", { hasText: "Asset 1" })
    ).not.toBeVisible();
  });
});
