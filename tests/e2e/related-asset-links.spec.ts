import { test, expect, type Page } from "@playwright/test";
import { setupWorkerHTTPHeader, refreshDatabase } from "../setup";

const PARENT_ASSET_ID = "related_links_parent_001";

function signInRequiredHeading(page: Page) {
  return page
    .locator(".asset-view-page")
    .getByRole("heading", { name: "Sign In Required" });
}

test.describe("Related assets visible only through their parent", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });

    // Signing in here fails both sign-in notice tests:
    // a signed-in viewer can open the protected pieces.
    await page.goto(`/asset/viewAsset/${PARENT_ASSET_ID}`);
  });

  test("a nested protected piece renders inside its parent", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Nested Protected Piece" }).click();

    await expect(page.locator(".accordion__body")).toContainText("file.txt");
  });

  test("following a related asset link shows the sign-in notice", async ({
    page,
  }) => {
    await page
      .getByRole("link", { name: "Protected Piece", exact: true })
      .click();

    await expect(signInRequiredHeading(page)).toBeVisible();
  });

  test("following a nested piece's arrow shows the sign-in notice", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Nested Protected Piece" }).click();
    await page.locator(".accordion__body .arrow-button").click();

    await expect(signInRequiredHeading(page)).toBeVisible();
  });
});
