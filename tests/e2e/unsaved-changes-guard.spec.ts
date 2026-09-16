import { test, expect, type Page } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";

// Asset 1 from the mock seed data
const ASSET_1_ID = "6875871d4eb080a4880a0f44";

// SPA navigation via the logo RouterLink fires onBeforeRouteLeave, where a
// guard can intervene. A full reload would only hit beforeunload.
async function navigateHome(page: Page): Promise<void> {
  await page.locator(".app-header__logo-link").click();
}

test.describe("leaving the asset editor with unsaved edits", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });

    await page.goto(`/assetManager/editAsset/${ASSET_1_ID}`);
    await expect(page.getByLabel(/title/i).first()).toHaveValue("Asset 1");
  });

  test("asks for confirmation instead of dropping the edits", async ({
    page,
  }) => {
    const titleField = page.getByLabel(/title/i).first();
    await titleField.fill("Asset 1, edited");

    await navigateHome(page);

    const confirm = page.getByRole("dialog", { name: "Unsaved changes" });
    await expect(confirm).toBeVisible();
    await expect(page).toHaveURL(/editAsset/);

    // staying keeps the page and the edits
    await confirm.getByRole("button", { name: "Stay" }).click();
    await expect(confirm).not.toBeVisible();
    await expect(page).toHaveURL(/editAsset/);
    await expect(titleField).toHaveValue("Asset 1, edited");
  });

  test("leaves without asking when nothing was edited", async ({ page }) => {
    await navigateHome(page);

    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page).not.toHaveURL(/editAsset/);
  });
});
