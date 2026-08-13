import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";
import mockServerConfig from "../../mock-server/config";

const MOCK_SERVER_BASE = `${mockServerConfig.ORIGIN}:${mockServerConfig.PORT}`;

// Asset 1 from seed data — has exactly 1 upload_1 entry with fileId "687587494eb080a4880a0f46"
const KNOWN_ASSET_ID = "6875871d4eb080a4880a0f44";

test.describe("Delete Asset", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });
    await page.goto("/");
  });

  test("navigating to a deleted asset's URL returns 410, not the asset data", async ({
    page,
    request,
  }) => {
    const workerId = test.info().workerIndex.toString();

    // Confirm the asset loads normally before deletion
    const [beforeResponse] = await Promise.all([
      page.waitForResponse((r) =>
        r.url().includes(`/asset/viewAsset/${KNOWN_ASSET_ID}/true`)
      ),
      page.goto(`/asset/viewAsset/${KNOWN_ASSET_ID}`),
    ]);
    expect(beforeResponse.status()).toBe(200);

    // Delete the asset
    const deleteResponse = await request.delete(
      `${MOCK_SERVER_BASE}/defaultinstance/assetManager/deleteAsset/${KNOWN_ASSET_ID}/true`,
      { headers: { "x-worker-id": workerId } }
    );
    expect(deleteResponse.status()).toBe(204);

    // Navigate to the deleted asset's URL and capture the viewAsset API response
    const [afterResponse] = await Promise.all([
      page.waitForResponse((r) =>
        r.url().includes(`/asset/viewAsset/${KNOWN_ASSET_ID}/true`)
      ),
      page.goto(`/asset/viewAsset/${KNOWN_ASSET_ID}`),
    ]);

    // The backend should return 410 Gone for a deleted asset, not 200
    expect(afterResponse.status()).toBe(410);
  });

  test("deleting an edited asset leaves without asking to discard changes", async ({
    page,
  }) => {
    await page.goto(`/assetManager/editAsset/${KNOWN_ASSET_ID}`);

    const titleField = page.getByLabel(/title/i).first();
    await expect(titleField).toHaveValue("Asset 1");

    await titleField.fill("Asset 1 - edited, then deleted");
    await expect(page.getByTestId("unsaved-changes-indicator")).toHaveText(
      "Unsaved changes"
    );

    // The menu raises a browser confirm before it deletes.
    page.once("dialog", (dialog) => dialog.accept());

    await page.getByRole("button", { name: "Toggle main menu" }).click();
    await page.getByRole("button", { name: "Manage Assets" }).click();
    await page.locator(".edit-nav-section__delete-asset").click();

    // The asset is gone, so there is nowhere to save the edits and nothing to
    // ask about.
    await expect(page).toHaveURL(/\/assetManager\/userAssets/);
    await expect(
      page.getByRole("heading", { name: "Unsaved changes" })
    ).not.toBeVisible();
  });
});
