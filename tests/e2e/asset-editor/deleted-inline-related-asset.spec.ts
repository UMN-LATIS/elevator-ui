import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../../setup";
import mockServerConfig from "../../../mock-server/config";

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

    // create a parent asset with an inline child, then delete the child
    await page.goto("/assetManager/addAsset");
    await page
      .getByLabel("Template")
      .selectOption({ label: "Inline Parent Template" });
    await page.getByLabel("Collection").selectOption({ index: 1 });
    await page.getByRole("button", { name: "Continue" }).click();

    // the child's own editor finished initializing once it names its template
    await expect(
      page.locator(".inline-edit-asset-page h3", {
        hasText: "Inline Child Template",
      })
    ).toBeVisible();

    const titleFields = page.getByLabel(/title/i);
    await titleFields.first().fill("Parent With Deleted Child");
    await titleFields.nth(1).fill("Child To Delete");

    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL(/\/assetManager\/editAsset\//);
    parentAssetId = page.url().split("/editAsset/")[1];

    // the saved parent names its child in the related asset widget's row
    const resp = await request.get(
      `${MOCK_SERVER_BASE}/defaultinstance/asset/viewAsset/${parentAssetId}/true`,
      { headers: { "x-worker-id": workerId } }
    );
    const parentAsset = await resp.json();
    childAssetId = parentAsset.inlinechild_1?.[0]?.targetAssetId;
    expect(childAssetId).toBeTruthy();

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

    // the regression this guards against rendered "Widget Error" instead
    await expect(page.getByText("Widget Error")).not.toBeVisible();
    await expect(page.getByText("Asset Deleted")).toBeVisible();
  });
});
