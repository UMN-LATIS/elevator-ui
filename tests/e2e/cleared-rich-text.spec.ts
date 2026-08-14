import { test, expect, type Page } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";

// "Default Collection" seeds with a one-paragraph description
const WRITTEN_DESCRIPTION_COLLECTION_ID = 1;
// "Parent Collection" seeds with a blank description
const BLANK_DESCRIPTION_COLLECTION_ID = 3;

/**
 * Types one character into the rich text editor and deletes it again,
 * leaving the editor as empty as it was found.
 */
async function typeAndDeleteACharacter(page: Page) {
  const editor = page.locator(".ql-editor");
  await editor.click();
  await editor.pressSequentially("a");
  await expect(page.getByTestId("unsaved-changes-indicator")).toHaveText(
    "Unsaved changes"
  );

  await page.keyboard.press("Backspace");
}

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

  test("a collection description typed and deleted again is not a change", async ({
    page,
  }) => {
    await page.goto(
      `/admin/collections/edit/${BLANK_DESCRIPTION_COLLECTION_ID}`
    );
    await expect(page.getByTestId("unsaved-changes-indicator")).toHaveText(
      "No unsaved changes"
    );

    await typeAndDeleteACharacter(page);

    await expect(page.getByTestId("unsaved-changes-indicator")).toHaveText(
      "No unsaved changes"
    );
  });

  // the page editor reads the body through getSemanticHtml rather than
  // v-model, so it needs its own coverage
  test("a page body typed and deleted again is not a change", async ({
    page,
  }) => {
    await page.goto("/instances/createPage");
    await expect(page.getByTestId("unsaved-changes-indicator")).toHaveText(
      "No unsaved changes"
    );

    await typeAndDeleteACharacter(page);

    await expect(page.getByTestId("unsaved-changes-indicator")).toHaveText(
      "No unsaved changes"
    );
  });

  test("a written collection description still loads clean", async ({
    page,
  }) => {
    await page.goto(
      `/admin/collections/edit/${WRITTEN_DESCRIPTION_COLLECTION_ID}`
    );

    await expect(page.getByLabel("Title")).toHaveValue("Default Collection");
    await expect(page.getByTestId("unsaved-changes-indicator")).toHaveText(
      "No unsaved changes"
    );
  });
});
