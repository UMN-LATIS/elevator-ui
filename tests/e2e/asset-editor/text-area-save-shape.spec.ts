import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../../setup";

test.describe("text area html and the save", () => {
  test.beforeEach(async ({ page, request }) => {
    // the template's location widget calls out to arcgis
    await page.route("**/arcgis.com/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "{}",
      })
    );

    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });

    await page.goto("/assetManager/addAsset");
    await page
      .getByLabel("Template")
      .selectOption({ label: "All Fields Test" });
    await page.getByLabel("Collection").selectOption({ index: 1 });
    await page.getByRole("button", { name: "Continue" }).click();
  });

  test("a bullet list is sent as a ul, not as quill's editor markup", async ({
    page,
  }) => {
    test.setTimeout(30_000);

    await page.getByLabel(/title/i).first().fill("Formatted asset");

    const editor = page.locator(".ql-editor").first();
    await editor.click();
    await page.keyboard.type("one");
    await page.keyboard.press("Enter");
    await page.keyboard.type("two");

    await page.keyboard.press("ControlOrMeta+a");
    await page.locator('button.ql-list[value="bullet"]').first().click();

    const save = page.waitForResponse(
      (response) =>
        response.url().includes("/assetManager/submission/true") &&
        response.request().method() === "POST"
    );
    await page.getByRole("button", { name: "Save" }).click();
    const sentBody = (await save).request().postData() ?? "";

    expect(sentBody).toContain("<ul>");
    expect(sentBody).toContain("<li>one</li>");
    // quill's own list markup renders as a numbered list anywhere but the
    // editor, and the ql-ui spans show up as stray empty elements
    expect(sentBody).not.toContain("data-list");
    expect(sentBody).not.toContain("ql-ui");
  });
});
