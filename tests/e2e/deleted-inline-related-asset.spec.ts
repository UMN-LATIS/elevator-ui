import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";
import mockServerConfig from "../../mock-server/config";

const MOCK_SERVER_BASE = `${mockServerConfig.ORIGIN}:${mockServerConfig.PORT}`;

test.describe("Deleted Inline Related Asset", () => {
  let workerId: string;
  let parentAssetId: string;
  let childAssetId: string;

  test.beforeEach(async ({ page, request }) => {
    workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });

    // Create a parent asset with an inline child, then delete the child.
    // 1. Create the parent (uses Inline Parent Template, id 102)
    await page.goto("/assetManager/addAsset");
    await page.getByLabel("Template").selectOption({ label: "Inline Parent Template" });
    await page.getByLabel("Collection").selectOption({ index: 1 });
    await page.getByRole("button", { name: "Continue" }).click();

    // Wait for inline child form to load
    await expect(
      page.locator(".inline-edit-asset-page h3", {
        hasText: "Inline Child Template",
      })
    ).toBeVisible();

    // Fill parent title and child title
    const titleFields = page.getByLabel(/title/i);
    await titleFields.first().fill("Parent With Deleted Child");
    await titleFields.nth(1).fill("Child To Delete");

    // Save
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL(/\/assetManager\/editAsset\//);

    // Extract the parent and child asset IDs
    const url = page.url();
    parentAssetId = url.split("/editAsset/")[1];

    // Find the child asset ID from the inline form's targetAssetId
    childAssetId = await page.locator(".inline-edit-asset-page").evaluate(
      (el) => {
        // The InlineCreateOrEditAssetPage renders EditWidgets that have assetId props
        // We can find it from the URL of any link, or from the DOM data
        const widgetEl = el.querySelector("[data-asset-id]");
        return widgetEl?.getAttribute("data-asset-id") ?? "";
      }
    );

    // If we couldn't find it from the DOM, get it from the API
    if (!childAssetId) {
      const resp = await request.get(
        `${MOCK_SERVER_BASE}/defaultinstance/asset/viewAsset/${parentAssetId}/true`,
        { headers: { "x-worker-id": workerId } }
      );
      const parentAsset = await resp.json();
      childAssetId = parentAsset.inlinechild_1?.[0]?.targetAssetId;
    }

    expect(childAssetId).toBeTruthy();

    // Delete the child asset via API
    const deleteResp = await request.delete(
      `${MOCK_SERVER_BASE}/defaultinstance/assetManager/deleteAsset/${childAssetId}/true`,
      { headers: { "x-worker-id": workerId } }
    );
    expect(deleteResp.status()).toBe(204);
  });

  test("editing a parent asset with a deleted inline child shows deleted notice instead of widget error", async ({
    page,
  }) => {
    await page.goto(`/assetManager/editAsset/${parentAssetId}`);

    // Should NOT show a "Widget Error" — that's the current broken behavior
    await expect(page.getByText("Widget Error")).not.toBeVisible();

    // Should show the deleted asset notice within the inline form area
    await expect(page.getByText("Asset Deleted")).toBeVisible();
  });
});
