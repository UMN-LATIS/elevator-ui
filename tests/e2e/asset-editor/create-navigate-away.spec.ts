import { test, expect } from "@playwright/test";
import {
  setupWorkerHTTPHeader,
  loginUser,
  refreshDatabase,
  SAVE_ROUTE,
} from "../../setup";

test.describe("navigating away while a create is in flight", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });
  });

  test("the resolved save does not pull the user back into the editor", async ({
    page,
  }) => {
    // Pins a data-loss or UX bug in the current editor. Goes green when the
    // reducer editor lands in the next PR of this stack.
    test.fail();

    await page.goto("/assetManager/addAsset");
    // a template with no inline related asset, so exactly one editor saves
    await page.getByLabel("Template").selectOption({ label: "Some Fields" });
    await page.getByLabel("Collection").selectOption({ index: 1 });
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel(/title/i).first().fill("Left before the save landed");

    const saveResponded = page.waitForResponse(SAVE_ROUTE);
    await page.getByRole("button", { name: "Save" }).click();

    // leave while the save is in flight (the mock holds saves 500ms)
    await page.locator(".app-header__logo-link").click();
    await expect(page).not.toHaveURL(/addAsset/);
    await saveResponded;

    // the save finishing must not redirect a page the user already left,
    // so hold here long enough for a late redirect to show itself
    await page.waitForTimeout(1000);
    await expect(page).not.toHaveURL(/editAsset/);
  });
});
