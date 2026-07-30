import { test, expect, type APIRequestContext } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";
import mockServerConfig from "../../mock-server/config";

const MOCK_SERVER_BASE = `${mockServerConfig.ORIGIN}:${mockServerConfig.PORT}`;

// Seeded as page 5 in mock-server/db/customPages.ts. Kept in sync by hand
// so the unedited-save test can assert byte-identity.
const SEED_BODY =
  '<div class="wrapper" id="hero"><h2 id="hours">Hours</h2><p data-track="top">Open 9 to 5</p><iframe src="https://example.com/embed"></iframe></div>';

const PAGE_ID = 5;

async function fetchStoredBody({
  request,
  workerId,
  pageId = PAGE_ID,
}: {
  request: APIRequestContext;
  workerId: string;
  pageId?: number;
}): Promise<string> {
  // the mock serves the default instance under its base path
  const response = await request.get(
    `${MOCK_SERVER_BASE}/defaultinstance/instances/getPage/${pageId}`,
    { headers: { "x-worker-id": workerId } }
  );
  expect(response.ok()).toBe(true);
  const page = (await response.json()) as { body: string };
  return page.body;
}

test.describe("Custom page HTML preservation (#623)", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "admin" });
  });

  test("a body quill cannot represent opens in custom html with a notice naming the markup", async ({
    page,
  }) => {
    await page.goto(`/instances/editPage/${PAGE_ID}`);

    const textarea = page.getByTestId("page-body-source-textarea");
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveValue(SEED_BODY);
    await expect(
      page.getByRole("radio", { name: "Custom HTML" })
    ).toBeChecked();

    const notice = page.getByTestId("page-markup-loss-warning");
    await expect(notice).toBeVisible();
    await expect(notice).toContainText("<div>");
    await expect(notice).toContainText("id (attribute)");
    await expect(notice).toContainText("<iframe>");
  });

  test("saving without editing stores the body byte-identical", async ({
    page,
    request,
  }) => {
    const workerId = test.info().workerIndex.toString();

    await page.goto(`/instances/editPage/${PAGE_ID}`);
    await expect(page.getByTestId("page-body-source-textarea")).toBeVisible();

    await page.getByRole("button", { name: "Save", exact: true }).click();
    await page.waitForURL("**/instances/customPages");

    const storedBody = await fetchStoredBody({ request, workerId });
    expect(storedBody).toBe(SEED_BODY);
  });

  test("edits in source mode survive save and reload", async ({
    page,
    request,
  }) => {
    const workerId = test.info().workerIndex.toString();
    const editedBody =
      '<section id="new-section" class="fancy"><h2 id="anchor">Edited</h2><p data-x="1">Body</p></section>';

    await page.goto(`/instances/editPage/${PAGE_ID}`);
    const textarea = page.getByTestId("page-body-source-textarea");
    await expect(textarea).toBeVisible();
    await textarea.fill(editedBody);

    await page.getByRole("button", { name: "Save", exact: true }).click();
    await page.waitForURL("**/instances/customPages");

    const storedBody = await fetchStoredBody({ request, workerId });
    expect(storedBody).toContain('id="new-section"');
    expect(storedBody).toContain('class="fancy"');
    expect(storedBody).toContain('id="anchor"');
    expect(storedBody).toContain('data-x="1"');
    expect(storedBody).toContain("<section");

    // reopening shows the saved markup, still in source mode
    await page.goto(`/instances/editPage/${PAGE_ID}`);
    await expect(page.getByTestId("page-body-source-textarea")).toHaveValue(
      storedBody
    );
  });

  test("the notice appears when unsupported HTML is typed into a page that started clean", async ({
    page,
  }) => {
    // page 2 is plain prose, so it opens in the visual editor with no notice
    await page.goto("/instances/editPage/2");
    const markupStyle = page.getByTestId("page-markup-style");
    await expect(
      page.getByRole("radio", { name: "Simple formatting" })
    ).toBeChecked();
    await expect(page.getByTestId("page-markup-loss-warning")).toBeHidden();

    await markupStyle.getByText("Custom HTML", { exact: true }).click();
    const textarea = page.getByTestId("page-body-source-textarea");
    await expect(textarea).toBeVisible();
    await expect(page.getByTestId("page-markup-loss-warning")).toBeHidden();

    await textarea.fill('<div id="added">Now unsupported</div>');

    const notice = page.getByTestId("page-markup-loss-warning");
    await expect(notice).toBeVisible();
    await expect(notice).toContainText("<div>");
    await expect(notice).toContainText("id (attribute)");
  });

  test("switching to simple formatting reports the loss and can be undone", async ({
    page,
  }) => {
    await page.goto(`/instances/editPage/${PAGE_ID}`);
    const markupStyle = page.getByTestId("page-markup-style");
    await expect(page.getByTestId("page-body-source-textarea")).toBeVisible();

    await markupStyle.getByText("Simple formatting", { exact: true }).click();

    const report = page.getByTestId("page-markup-loss-report");
    await expect(report).toBeVisible();
    await expect(report).toContainText("<div>");
    await expect(report).toContainText("<iframe>");
    await expect(page.getByTestId("page-body-source-textarea")).toBeHidden();

    await page.getByTestId("page-markup-undo").click();

    await expect(
      page.getByRole("radio", { name: "Custom HTML" })
    ).toBeChecked();
    await expect(page.getByTestId("page-body-source-textarea")).toHaveValue(
      SEED_BODY
    );
    await expect(report).toBeHidden();
  });

  test("the visual editor no longer saves every space as an entity", async ({
    page,
    request,
  }) => {
    const workerId = test.info().workerIndex.toString();

    // page 2 is prose, so it opens in the visual editor
    await page.goto("/instances/editPage/2");
    const editor = page.locator(".ql-editor");
    await expect(editor).toBeVisible();

    await editor.click();
    await editor.pressSequentially(" Open 9 to 5 every weekday.");

    await page.getByRole("button", { name: "Save", exact: true }).click();
    await page.waitForURL("**/instances/customPages");

    const storedBody = await fetchStoredBody({ request, workerId, pageId: 2 });

    expect(storedBody).toContain("Open 9 to 5 every weekday.");
    expect(storedBody).not.toContain("&nbsp;");
  });

  test("script tags are removed on save without disturbing other markup", async ({
    page,
    request,
  }) => {
    const workerId = test.info().workerIndex.toString();

    await page.goto(`/instances/editPage/${PAGE_ID}`);
    const textarea = page.getByTestId("page-body-source-textarea");
    await expect(textarea).toBeVisible();
    await textarea.fill('<p id="keep">Hi</p><script>alert(1)</script>');

    await page.getByRole("button", { name: "Save", exact: true }).click();
    await page.waitForURL("**/instances/customPages");

    const storedBody = await fetchStoredBody({ request, workerId });
    expect(storedBody).toContain('id="keep"');
    expect(storedBody).not.toContain("script");
    expect(storedBody).not.toContain("alert(1)");
  });
});
