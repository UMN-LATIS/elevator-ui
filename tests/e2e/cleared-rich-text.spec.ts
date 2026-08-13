import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";

// "Default Collection" seeds with a one-paragraph description
const WRITTEN_DESCRIPTION_COLLECTION_ID = 1;

test.describe("Clearing a rich text field", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "admin" });
  });

  test("a collection description the admin deleted saves as empty", async ({
    page,
  }) => {
    await page.goto(
      `/admin/collections/edit/${WRITTEN_DESCRIPTION_COLLECTION_ID}`
    );

    const description = page.locator(".ql-editor");
    await expect(description).toContainText("no home of its own");

    await description.click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.press("Backspace");

    const saveRequest = page.waitForRequest(
      (request) =>
        request.method() === "PUT" &&
        request
          .url()
          .includes(
            `/adminCollections/collections/${WRITTEN_DESCRIPTION_COLLECTION_ID}`
          )
    );
    await page.getByRole("button", { name: "Save" }).click();

    // quill cannot hold an empty document, so without the blank check this
    // stores the paragraph it keeps for the cursor
    const savedFields = new URLSearchParams(
      (await saveRequest).postData() ?? ""
    );
    expect(savedFields.get("description")).toBe("");
  });
});
