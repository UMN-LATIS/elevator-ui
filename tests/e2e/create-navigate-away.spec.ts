import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";

const SAVE_ROUTE = "**/assetManager/submission/**";

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
    // the resolved create's redirect yanks the user back into the editor
    // fixme, not fail: the confirm this waits for does not exist yet, so the
    // test hangs instead of failing
    test.fixme();

    await page.goto("/assetManager/addAsset");
    // a template with no inline related asset, so exactly one editor saves
    await page.getByLabel("Template").selectOption({ label: "Some Fields" });
    await page.getByLabel("Collection").selectOption({ index: 1 });
    await page.getByRole("button", { name: "Continue" }).click();
    await page
      .getByLabel(/title/i)
      .first()
      .fill("Left before the save landed");

    const saveResponded = page.waitForResponse(SAVE_ROUTE);
    await page.getByRole("button", { name: "Save" }).click();

    // leave while the save is in flight (the mock holds saves 500ms). The
    // draft still counts as unsaved, so leaving takes a confirmation.
    await page.locator(".app-header__logo-link").click();
    await page.getByRole("button", { name: "Leave" }).click();
    await expect(page).not.toHaveURL(/addAsset/);
    await saveResponded;

    // the save finishing must not redirect a page the user already left,
    // so hold here long enough for a late redirect to show itself
    await page.waitForTimeout(1000);
    await expect(page).not.toHaveURL(/editAsset/);
  });
});
