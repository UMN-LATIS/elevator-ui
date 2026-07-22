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

    // Wait for the submission to persist before reloading. Reloading first
    // aborts the in-flight save and reads back the seeded coordinates.
    const saveResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/assetManager/submission/true") &&
        response.request().method() === "POST"
    );
    await saveButton.click();
    await saveResponse;

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

    expect(pageErrors).toHaveLength(0);
  });
});
