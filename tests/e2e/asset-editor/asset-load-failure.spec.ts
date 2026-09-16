import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../../setup";

// Asset 1 from the mock seed data
const ASSET_ID = "6875871d4eb080a4880a0f44";

test.describe("an asset that fails to load", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });
  });

  test("tells the user instead of spinning forever", async ({ page }) => {
    // 404 rather than 500: 404 is non-retryable, so the failure is immediate
    // and a spinner still visible afterwards is stuck for good. 410 is the
    // deleted-asset case, which has its own notice.
    await page.route(`**/asset/viewAsset/${ASSET_ID}/**`, (route) =>
      route.fulfill({
        status: 404,
        contentType: "application/json",
        body: "{}",
      })
    );

    await page.goto(`/assetManager/editAsset/${ASSET_ID}`);

    await expect(
      page.getByText("This asset could not be loaded.")
    ).toBeVisible();
    await expect(page.getByText("Loading...")).not.toBeVisible();
  });

  test("an inline related asset that fails says so inside the parent form", async ({
    page,
  }) => {
    // a parent with an inline child, so reopening it loads two assets
    await page.goto("/assetManager/addAsset");
    await page
      .getByLabel("Template")
      .selectOption({ label: "Inline Parent Template" });
    await page.getByLabel("Collection").selectOption({ index: 1 });
    await page.getByRole("button", { name: "Continue" }).click();

    const titleFields = page.getByLabel(/title/i);
    await titleFields.first().fill("Parent of a child that will not load");
    await titleFields.nth(1).fill("Child that will not load");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL(/\/assetManager\/editAsset\//);
    const parentAssetId = page.url().split("/editAsset/")[1];

    // fail every asset load except the parent's, which leaves the child as
    // the only one that cannot load
    await page.route("**/asset/viewAsset/**", (route) =>
      route.request().url().includes(parentAssetId)
        ? route.continue()
        : route.fulfill({
            status: 404,
            contentType: "application/json",
            body: "{}",
          })
    );

    await page.goto(`/assetManager/editAsset/${parentAssetId}`);

    await expect(
      page.getByText("This related asset could not be loaded.")
    ).toBeVisible();
    // the parent itself still loads, so its own form is there
    await expect(titleFields.first()).toHaveValue(
      "Parent of a child that will not load"
    );
  });
});
