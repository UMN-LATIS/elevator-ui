import {
  test,
  expect,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";
import mockServerConfig from "../../mock-server/config";

const MOCK_SERVER_BASE = `${mockServerConfig.ORIGIN}:${mockServerConfig.PORT}`;

// Seeded on collection 2 in mock-server/db/collections.ts. Kept in sync by
// hand so the unedited-save test can assert byte-identity.
const SEED_DESCRIPTION =
  '<div class="hero" id="intro"><figure class="hero__media"><img src="https://example.com/hero.jpg" alt=""></figure><h2 class="hero__title">Second Collection</h2><p data-track="intro">Testimony gathered for the second collection.</p></div>';

const COLLECTION_ID = 2;

async function fetchStoredDescription({
  request,
  workerId,
}: {
  request: APIRequestContext;
  workerId: string;
}): Promise<string> {
  // the endpoint the collection page reads its description from
  const response = await request.get(
    `${MOCK_SERVER_BASE}/defaultinstance/collections/collectionHeader/${COLLECTION_ID}/true`,
    { headers: { "x-worker-id": workerId } }
  );
  expect(response.ok()).toBe(true);
  const header = (await response.json()) as { collectionDescription: string };
  return header.collectionDescription;
}

async function saveCollection(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.waitForURL("**/admin/collections");
}

test.describe("Collection description HTML preservation", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "admin" });
  });

  test("a description quill cannot represent opens in custom html", async ({
    page,
  }) => {
    await page.goto(`/admin/collections/edit/${COLLECTION_ID}`);

    const textarea = page.getByTestId("html-body-source-textarea");
    await expect(textarea).toHaveValue(SEED_DESCRIPTION);
    await expect(
      page.getByRole("switch", { name: "Custom HTML" })
    ).toBeChecked();
    await expect(
      page.getByRole("button", {
        name: "This description uses HTML the toolbar cannot produce",
      })
    ).toBeVisible();
  });

  test("saving other fields leaves the description byte-identical", async ({
    page,
    request,
  }) => {
    const workerId = test.info().workerIndex.toString();

    await page.goto(`/admin/collections/edit/${COLLECTION_ID}`);
    await expect(page.getByTestId("html-body-source-textarea")).toBeVisible();
    await page.getByPlaceholder("Collection title").fill("Renamed Collection");
    await saveCollection(page);

    expect(await fetchStoredDescription({ request, workerId })).toBe(
      SEED_DESCRIPTION
    );
  });

  test("edits in source mode survive save and reload", async ({
    page,
    request,
  }) => {
    const workerId = test.info().workerIndex.toString();
    const editedDescription =
      '<section class="intro" id="edited"><figure class="intro__media"><img src="https://example.com/new.jpg" alt=""></figure><p data-track="edited">New text</p></section>';

    await page.goto(`/admin/collections/edit/${COLLECTION_ID}`);
    const textarea = page.getByTestId("html-body-source-textarea");
    await expect(textarea).toBeVisible();
    await textarea.fill(editedDescription);
    await saveCollection(page);

    const storedDescription = await fetchStoredDescription({
      request,
      workerId,
    });
    expect(storedDescription).toContain('<section class="intro" id="edited">');
    expect(storedDescription).toContain('<figure class="intro__media">');
    expect(storedDescription).toContain('data-track="edited"');

    // reopening shows the saved markup, still in source mode
    await page.goto(`/admin/collections/edit/${COLLECTION_ID}`);
    await expect(page.getByTestId("html-body-source-textarea")).toHaveValue(
      storedDescription
    );
  });
});
