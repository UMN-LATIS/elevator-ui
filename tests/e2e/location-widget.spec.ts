import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";

test.describe("Location Widget", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });
    await page.goto("/");
  });

  test("invalid lng/lat in edit form shows an error and asset remains saveable", async ({
    page,
  }) => {
    const assetId = "6875871d4eb080a4880a0abc";
    const pageErrors: Error[] = [];
    page.on("pageerror", (err) => pageErrors.push(err));

    await page.goto(`/assetManager/editAsset/${assetId}`);

    await expect(page).toHaveURL(new RegExp(`/assetManager/editAsset/${assetId}`));
    await expect(page.getByLabel(/title/i).first()).toHaveValue(
      "Invalid Location Asset"
    );

    // The "All Fields Test" template renders two location widgets. Target
    // the first, which holds this asset's seeded out-of-range coordinates.
    const longitudeInput = page.getByLabel("Longitude").first();
    const latitudeInput = page.getByLabel("Latitude").first();

    await longitudeInput.fill("190");
    await latitudeInput.fill("95");

    await expect(page.getByText(/between -180 and 180/i)).toBeVisible();
    await expect(page.getByText(/between -90 and 90/i)).toBeVisible();

    const saveButton = page.getByRole("button", { name: "Save" });
    await expect(saveButton).toBeEnabled();

    // Editing fires two submission POSTs: the inline child asset first, then
    // the parent. The parent POST is only sent after the child save resolves,
    // so wait for the PARENT save (its body carries this assetId) before
    // reloading. Waiting on the first response reloads before the parent POST
    // leaves the browser, and the seeded coordinates survive.
    const parentSave = page.waitForResponse(
      (response) =>
        response.url().includes("/assetManager/submission/true") &&
        response.request().method() === "POST" &&
        !!response.request().postData()?.includes(assetId)
    );
    await saveButton.click();
    await parentSave;

    await expect(page).toHaveURL(new RegExp(`/assetManager/editAsset/${assetId}`));
    await page.reload();

    await expect(longitudeInput).toHaveValue("190");
    await expect(latitudeInput).toHaveValue("95");
    await expect(page.getByText(/between -180 and 180/i)).toBeVisible();
    await expect(page.getByText(/between -90 and 90/i)).toBeVisible();
    expect(pageErrors).toHaveLength(0);
  });

  test("viewing an asset with invalid lng/lat does not crash and shows hyphens", async ({
    page,
  }) => {
    const assetId = "6875871d4eb080a4880a0abc";
    const pageErrors: Error[] = [];
    page.on("pageerror", (err) => pageErrors.push(err));

    await page.goto(`/asset/viewAsset/${assetId}`);

    await expect(page).toHaveURL(new RegExp(`/asset/viewAsset/${assetId}`));
    await expect(page.locator("body")).not.toBeEmpty();
    await expect(page.getByText("Invalid Location Asset").first()).toBeVisible();

    // Invalid/out-of-range coordinates should render as hyphens in the location summary.
    await expect(page.getByText(/Lat\s*-/, { exact: false })).toBeVisible();
    await expect(page.getByText(/Lng\s*-/, { exact: false })).toBeVisible();

    // No valid coordinates means the map modal trigger is hidden.
    await expect(page.getByRole("button", { name: "Show Location" })).toHaveCount(
      0
    );

    // The ObjectViewer embeds the app in an iframe pointed at the instance's
    // absolute base URL. Under dev:mock the app runs on :5173 while the mock
    // API is on :3001, so the iframe's app-shell calls are cross-origin and
    // reject with "Network Error". Filter this out since it doesn't pertain
    // to our lnglat test.
    const crashErrors = pageErrors.filter(
      (err) => !/network error/i.test(err.message)
    );
    expect(crashErrors).toHaveLength(0);
  });
});
