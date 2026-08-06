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
    // the inputs are rewritten from the model, so out-of-range typing reaches
    // it
    test.fail();

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

    // out-of-range typing stays in the inputs with its error and never
    // reaches the model, so the seeded coordinates survive the save
    await expect(longitudeInput).toHaveValue("181");
    await expect(latitudeInput).toHaveValue("95");
    await expect(page.getByText(/between -180 and 180/i)).toBeVisible();
    expect(pageErrors).toHaveLength(0);
  });

  test("typing a decimal point is not eaten by the model echo", async ({
    page,
  }) => {
    const assetId = "6875871d4eb080a4880a0abc";
    await page.goto(`/assetManager/editAsset/${assetId}`);

    const longitudeInput = page.getByLabel("Longitude").first();
    await longitudeInput.fill("");
    await longitudeInput.pressSequentially("-92.05");

    await expect(longitudeInput).toHaveValue("-92.05");
  });

  test("clearing both coordinates removes the location from the asset", async ({
    page,
  }) => {
    // a saved location cannot be cleared
    test.fail();

    const assetId = "6875871d4eb080a4880a0abc";
    await page.goto(`/assetManager/editAsset/${assetId}`);

    const longitudeInput = page.getByLabel("Longitude").first();
    const latitudeInput = page.getByLabel("Latitude").first();
    await expect(longitudeInput).toHaveValue("181");

    await longitudeInput.fill("");
    await latitudeInput.fill("");

    const parentSave = page.waitForResponse(
      (response) =>
        response.url().includes("/assetManager/submission/true") &&
        response.request().method() === "POST" &&
        !!response.request().postData()?.includes(assetId)
    );
    await page.getByRole("button", { name: "Save" }).click();
    await parentSave;
    await page.reload();

    await expect(longitudeInput).toHaveValue("");
    await expect(latitudeInput).toHaveValue("");
  });

  test("clearing one coordinate warns instead of leaving a blank box", async ({
    page,
  }) => {
    // clearing one coordinate of a saved pair silently keeps the old point
    test.fail();

    await page.goto("/assetManager/editAsset/location_asset_minneapolis");

    const longitudeInput = page.getByLabel("Longitude").first();
    const latitudeInput = page.getByLabel("Latitude").first();
    await expect(longitudeInput).toHaveValue("-93.2733");

    // half a point cannot be stored, so the widget keeps the saved one and
    // says why, the same as it does for an out-of-range number. Silence here
    // would read as "no latitude" while the asset still holds one.
    await latitudeInput.fill("");

    await expect(
      page.getByText(/needs both a longitude and a latitude/i)
    ).toBeVisible();

    const parentSave = page.waitForResponse(
      (response) =>
        response.url().includes("/assetManager/submission/true") &&
        response.request().method() === "POST"
    );
    await page.getByRole("button", { name: "Save" }).click();
    await parentSave;
    await page.reload();

    await expect(latitudeInput).toHaveValue("44.9584");
  });

  test("warns that an address alone is not saved", async ({ page }) => {
    // the backend drops an address with no coordinates and the editor says
    // nothing
    test.fail();

    // this asset's location row has a label, an address, and coordinates. The
    // server keeps a row only for a label or coordinates, so emptying both
    // leaves an address the next save would throw away.
    await page.goto("/assetManager/editAsset/location_asset_minneapolis");

    const locationLabelInput = page.getByLabel("Location Label").first();
    const longitudeInput = page.getByLabel("Longitude").first();
    const latitudeInput = page.getByLabel("Latitude").first();
    await expect(locationLabelInput).toHaveValue("Minneapolis");

    await locationLabelInput.fill("");
    await longitudeInput.fill("");
    await latitudeInput.fill("");

    await expect(page.getByText(/this address is not saved/i)).toBeVisible();
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
