import { expect, type APIRequestContext, type Page } from "@playwright/test";
import mockServerConfig from "../mock-server/config";

export const MOCK_SERVER_BASE = `${mockServerConfig.ORIGIN}:${mockServerConfig.PORT}`;

// Simple helper to set up worker-specific test environment
export async function setupWorkerHTTPHeader({
  page,
  workerId,
}: {
  page: Page;
  workerId: string;
}) {
  // Set worker ID header for all frontend requests
  return await page.setExtraHTTPHeaders({
    "x-worker-id": workerId,
  });
}

export async function refreshDatabase({
  request,
  workerId,
}: {
  request: APIRequestContext;
  workerId: string;
}) {
  const response = await request.post(`${MOCK_SERVER_BASE}/_tests/db/refresh`, {
    headers: { "x-worker-id": workerId },
  });

  if (!response.ok()) {
    throw new Error(
      `Failed to refresh database: ${response.status()} ${await response.text()}`
    );
  }

  return await response.json();
}

export async function loginUser({
  request,
  page,
  workerId,
  username = "user",
}: {
  request: APIRequestContext;
  page: Page;
  workerId: string;
  username?: string;
}) {
  const response = await request.post(`${MOCK_SERVER_BASE}/_tests/auth/login`, {
    data: { username },
    headers: { "x-worker-id": workerId },
  });

  if (!response.ok()) {
    throw new Error(
      `Login failed: ${response.status()} ${await response.text()}`
    );
  }

  // Get the session cookie from the response and set it on the page
  const cookies = response.headers()["set-cookie"];
  if (cookies) {
    const sessionMatch = cookies.match(/ci_session=([^;]+)/);
    if (sessionMatch) {
      await page.context().addCookies([
        {
          name: "ci_session",
          value: sessionMatch[1],
          domain: "localhost",
          path: "/",
          secure: true,
          httpOnly: false,
        },
      ]);
    }
  }
}

export async function getAssetCount({
  request,
  workerId,
}: {
  request: APIRequestContext;
  workerId: string;
}): Promise<number> {
  const response = await request.get(
    `${MOCK_SERVER_BASE}/_tests/db/assets/count`,
    { headers: { "x-worker-id": workerId } }
  );

  if (!response.ok()) {
    throw new Error(
      `Failed to get asset count: ${response.status()} ${await response.text()}`
    );
  }

  const { count } = await response.json();
  return count;
}

export async function createMismatchedSearch({
  request,
  workerId,
  query = "",
  totalResultsOverride,
}: {
  request: APIRequestContext;
  workerId: string;
  query?: string;
  totalResultsOverride: number;
}) {
  const response = await request.post(
    `${MOCK_SERVER_BASE}/_tests/search/create`,
    {
      data: { query, totalResultsOverride },
      headers: { "x-worker-id": workerId },
    }
  );

  if (!response.ok()) {
    throw new Error(
      `Failed to create mismatched search: ${response.status()} ${await response.text()}`
    );
  }

  return await response.json();
}

export async function updateInstance({
  request,
  workerId,
  updates,
}: {
  request: APIRequestContext;
  workerId: string;
  updates: Record<string, unknown>;
}) {
  const response = await request.patch(
    `${MOCK_SERVER_BASE}/_tests/instance/update`,
    {
      data: updates,
      headers: { "x-worker-id": workerId },
    }
  );

  if (!response.ok()) {
    throw new Error(
      `Instance update failed: ${response.status()} ${await response.text()}`
    );
  }

  return await response.json();
}

/**
 * Reaches Add Asset from any menu state, waiting for each step to settle.
 *
 * Navigating in-app rather than by page.goto reuses the editor component
 * instead of remounting it, which is what a test of state carried across a
 * route change needs.
 *
 * @param isLeavingUnsavedWork - the caller expects the editor's
 * unsaved-changes guard to ask, and wants to leave anyway.
 */
export async function openAddAssetFromMenu(
  page: Page,
  { isLeavingUnsavedWork = false }: { isLeavingUnsavedWork?: boolean } = {}
): Promise<void> {
  const menu = page.locator("#app-menu-navigation");
  if (!(await menu.isVisible())) {
    await page.getByRole("button", { name: "Toggle main menu" }).click();
  }
  await expect(menu).toBeVisible();

  const addAssetLink = page.getByRole("link", { name: "Add Asset" });
  if (!(await addAssetLink.isVisible())) {
    await page.getByRole("button", { name: "Manage Assets" }).click();
  }
  await expect(addAssetLink).toBeVisible();
  await addAssetLink.click();
  if (isLeavingUnsavedWork) {
    await page
      .getByRole("dialog", { name: "Unsaved changes" })
      .getByRole("button", { name: "Leave" })
      .click();
  }
  await expect(page).toHaveURL(/\/assetManager\/addAsset/);
}

/**
 * Counts refetches of the saved asset, which is the step that hands the editor
 * the document a save is about. Register before any save runs, because the
 * refetch can land before a test gets the chance to wait on it.
 */
export function startCountingAssetRefetches(page: Page): () => number {
  let refetchCount = 0;
  page.on("response", (response) => {
    if (response.url().includes("asset/viewAsset/")) refetchCount += 1;
  });
  return () => refetchCount;
}

/**
 * Waits until the editor has applied a save.
 *
 * A save resolves in three steps: the submission response, a refetch of the
 * asset, then the state update. The refetch resolving pins the first two.
 * networkidle cannot: it resolves immediately once the page has ever been idle.
 */
export async function waitForSaveToLand(
  page: Page,
  refetchesBeforeSave: number,
  countAssetRefetches: () => number
): Promise<void> {
  await expect
    .poll(countAssetRefetches, { timeout: 20000 })
    .toBeGreaterThan(refetchesBeforeSave);
  // one frame pins the state update, after which only synchronous work remains
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(resolve))
  );
}

/** One asset save the page issued. A create sends an empty objectId. */
export type RecordedSave = { objectId: string };

export const SAVE_ROUTE = "**/assetManager/submission/**";

/**
 * Records every asset save the page issues, altering none of them.
 *
 * Specs that also have to hold a save open route the same URL themselves,
 * since that needs the request handler this one does not have.
 */
export async function recordSaves(page: Page): Promise<RecordedSave[]> {
  const saves: RecordedSave[] = [];
  await page.route(SAVE_ROUTE, async (route) => {
    const body = route.request().postData() ?? "";
    saves.push({ objectId: body.match(/"objectId":"([^"]*)"/)?.[1] ?? "" });
    await route.continue();
  });
  return saves;
}
