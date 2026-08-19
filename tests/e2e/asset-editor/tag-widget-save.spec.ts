import { test, expect } from "@playwright/test";
import {
  setupWorkerHTTPHeader,
  loginUser,
  refreshDatabase,
  startCountingAssetRefetches,
  waitForSaveToLand,
} from "../../setup";

test.describe("tag input and the save", () => {
  test.beforeEach(async ({ page, request }) => {
    // the template's location widget calls out to arcgis
    await page.route("**/arcgis.com/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "{}",
      })
    );

    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });

    await page.goto("/assetManager/addAsset");
    await page
      .getByLabel("Template")
      .selectOption({ label: "All Fields Test" });
    await page.getByLabel("Collection").selectOption({ index: 1 });
    await page.getByRole("button", { name: "Continue" }).click();
  });

  test("a typed but uncommitted tag survives the save", async ({ page }) => {
    // Pins a bug in the current editor, but flakes against it: red on some
    // full-suite runs and green on others. Skipped outright until the
    // reducer editor lands in the next PR of this stack.
    test.fixme();

    test.setTimeout(30_000);
    const countAssetRefetches = startCountingAssetRefetches(page);

    await page.getByLabel(/title/i).first().fill("Tagged asset");

    // type the tag but do not press enter, comma, or blur: clicking Save
    // must not lose it
    await page.getByPlaceholder("Some tags...").fill("history");

    const refetchesBeforeSave = countAssetRefetches();
    await page.getByRole("button", { name: "Save" }).click();
    await waitForSaveToLand(page, refetchesBeforeSave, countAssetRefetches);

    await page.reload();
    await expect(page.getByTestId("tag-item").first()).toContainText("history");
  });
});
