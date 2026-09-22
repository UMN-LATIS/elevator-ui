import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
import {
  setupWorkerHTTPHeader,
  loginUser,
  refreshDatabase,
  updateInstance,
} from "../setup";

const KEYWORDS_FIELD_ID = "keywords_1";

async function seedKeywordsTagListField({
  request,
  workerId,
}: {
  request: APIRequestContext;
  workerId: string;
}) {
  await updateInstance({
    request,
    workerId,
    updates: {
      sortableFields: {
        [KEYWORDS_FIELD_ID]: {
          label: "Keywords",
          template: 1,
          type: "tag list",
        },
      },
    },
  });
}

async function addKeywordsFilterRow(page: Page) {
  await page.getByRole("button", { name: "Advanced Search" }).first().click();
  await page.getByRole("button", { name: "Add Field" }).click();
  await page.getByRole("menuitem", { name: "Keywords" }).click();
}

test.describe("Advanced search tag list filters", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId });

    await seedKeywordsTagListField({ request, workerId });
  });

  test("offers a text input when the backend sends no tag values", async ({
    page,
  }) => {
    await page.route("**/search/getFieldInfo", (route) =>
      route.fulfill({ json: { type: "text" } })
    );
    await page.goto("/");

    await addKeywordsFilterRow(page);

    const keywordsInput = page.getByRole("textbox", { name: "Keywords" });
    await expect(keywordsInput).toBeVisible();

    await keywordsInput.fill("canoe");
    await expect(keywordsInput).toHaveValue("canoe");
  });

  test("still offers a dropdown when the backend sends tag values", async ({
    page,
  }) => {
    await page.route("**/search/getFieldInfo", (route) =>
      route.fulfill({ json: { type: "tag", values: ["canoe", "mask"] } })
    );
    await page.goto("/");

    await addKeywordsFilterRow(page);

    const keywordsDropdown = page.locator(".filter-row__value select");
    await expect(keywordsDropdown).toBeVisible();
    await expect(keywordsDropdown.locator("option")).toHaveText([
      "canoe",
      "mask",
    ]);
  });
});
