import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, refreshDatabase } from "../setup";

const PROTECTED_ASSET_ID = "protected_asset_001";

test.describe("Login deep link — protected asset", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });

    // Deliberately NOT logging in — user is unauthenticated
  });

  test("navigating to a protected asset shows sign-in modal", async ({
    page,
  }) => {
    await page.goto(`/asset/viewAsset/${PROTECTED_ASSET_ID}`);

    await expect(
      page.getByRole("heading", { name: "Sign In Required" })
    ).toBeVisible();
  });

  test("guest login from deep link redirects to the protected asset", async ({
    page,
  }) => {
    // 1. Navigate to protected asset while unauthenticated
    await page.goto(`/asset/viewAsset/${PROTECTED_ASSET_ID}`);

    // 2. Sign-in modal appears
    await expect(
      page.getByRole("heading", { name: "Sign In Required" })
    ).toBeVisible();

    // 3. Click the guest Login button in the modal
    await page.locator(".sign-in-required__local-login").click();

    // 4. Should be on the local login page with redirect param
    await expect(page).toHaveURL(
      /loginManager\/localLogin.*redirect.*protected_asset_001/
    );

    // 5. Fill in guest credentials and submit
    await page.getByLabel("Username").fill("user");
    await page.getByLabel("Password").fill("user");
    await page.getByRole("button", { name: "Login" }).click();

    // 6. Should redirect to the protected asset and render it
    await expect(page).toHaveURL(
      new RegExp(`asset/viewAsset/${PROTECTED_ASSET_ID}`)
    );
    await expect(page.getByText("Protected Asset")).toBeVisible();
  });
});
