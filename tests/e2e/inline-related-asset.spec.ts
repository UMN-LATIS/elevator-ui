import { test, expect } from "@playwright/test";
import {
  setupWorkerHTTPHeader,
  loginUser,
  refreshDatabase,
  getAssetCount,
} from "../setup";

test.describe("Inline Related Asset", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });
  });

  test("does not create an empty child asset when saving parent with an untouched inline form", async ({
    page,
    request,
  }) => {
    const workerId = test.info().workerIndex.toString();
    const countBefore = await getAssetCount({ request, workerId });

    await page.goto("/assetManager/addAsset");

    // Select the inline parent template (template 102)
    const templateSelect = page.getByLabel("Template");
    await templateSelect.selectOption({ label: "Inline Parent Template" });

    const collectionSelect = page.getByLabel("Collection");
    await collectionSelect.selectOption({ index: 1 });

    const continueButton = page.getByRole("button", { name: "Continue" });
    await continueButton.click();

    // Wait for the inline child form to appear
    await expect(page.locator(".inline-edit-asset-page")).toBeVisible();

    // Fill in the parent title only — deliberately leave the inline child form empty
    const titleField = page.getByLabel(/title/i).first();
    await titleField.fill("Test Parent Asset");

    const saveButton = page.getByRole("button", { name: "Save" });
    await saveButton.click();

    // Wait for redirect to the edit page
    await expect(page).toHaveURL(/\/assetManager\/editAsset\//);

    const countAfter = await getAssetCount({ request, workerId });

    // Only the parent should have been created — not the empty inline child
    expect(countAfter - countBefore).toBe(1);
  });
});
