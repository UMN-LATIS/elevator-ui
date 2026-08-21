import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";

test.describe("Date Widget With Null Label", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });
    await page.goto("/");
  });

  test("a required date with a null label counts as filled in", async ({
    page,
  }) => {
    // The API returns null rather than "" for an unset date label, and this
    // asset's date widget is required by the "Date Required" template.
    const assetId = "null_date_label_asset_001";
    await page.goto(`/assetManager/editAsset/${assetId}`);

    await expect(page.getByLabel("Date", { exact: true })).toHaveValue(
      "03/15/2026"
    );

    await expect(page.getByText("Missing required:")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Save" })).toBeEnabled();
  });
});
