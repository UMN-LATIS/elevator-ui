import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, refreshDatabase, loginUser } from "../setup";

const PROTECTED_ASSET_ID = "protected_asset_001";

test.describe("Login deep link — protected asset", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });

    // Deliberately NOT logging in — user is unauthenticated
  });

  test("navigating to a protected asset shows sign-in notice", async ({
    page,
  }) => {
    await page.goto(`/asset/viewAsset/${PROTECTED_ASSET_ID}`);

    await expect(
      page
        .locator(".asset-view-page")
        .getByRole("heading", { name: "Sign In Required" })
    ).toBeVisible();
  });

  test("guest login from deep link redirects to the protected asset", async ({
    page,
  }) => {
    // 1. Navigate to protected asset while unauthenticated
    await page.goto(`/asset/viewAsset/${PROTECTED_ASSET_ID}`);

    // 2. Sign-in notice appears
    await expect(
      page
        .locator(".asset-view-page")
        .getByRole("heading", { name: "Sign In Required" })
    ).toBeVisible();

    // 3. Click the guest Login button
    await page
      .locator(".asset-view-page .sign-in-required__local-login")
      .click();

    // 4. Should be on the local login page with redirect param
    await expect(page).toHaveURL(
      /loginManager\/localLogin.*redirect.*protected_asset_001/
    );

    // 5. Fill in guest credentials and submit
    await page.getByLabel("Username").fill("user");
    await page.getByLabel("Password").fill("user");
    await page.locator('button[type="submit"]').click();

    // 6. Should redirect to the protected asset and render it
    await expect(page).toHaveURL(
      new RegExp(`asset/viewAsset/${PROTECTED_ASSET_ID}`)
    );
    await expect(page.getByText("Protected Asset")).toBeVisible();
  });

  test("missing collection data does not block asset metadata", async ({
    page,
    request,
  }) => {
    const workerId = test.info().workerIndex.toString();
    await loginUser({ request, page, workerId, username: "curator" });

    await page.route("**/home/getInstanceNav", async (route) => {
      const response = await route.fetch();
      const instanceNav = await response.json();

      await route.fulfill({
        response,
        json: { ...instanceNav, collections: [] },
      });
    });

    await page.goto("/asset/viewAsset/6875871d4eb080a4880a0f44");

    await expect(page.getByText("Asset 1")).toBeVisible();
    await expect(
      page.locator(".asset-metadata").getByRole("heading", {
        name: "Sign In Required",
      })
    ).not.toBeVisible();
  });
});
