import { type APIRequestContext, type Page } from "@playwright/test";
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
 * Answers the next window.confirm and resolves with the message it showed.
 * Register it before the action that triggers the confirm.
 *
 * Registering any dialog listener turns off Playwright's auto-dismiss, so a
 * confirm this does not answer blocks the page.
 */
export function captureConfirm(
  page: Page,
  answer: "accept" | "dismiss"
): Promise<string> {
  return new Promise((resolve) => {
    page.once("dialog", async (dialog) => {
      const message = dialog.message();
      await (answer === "accept" ? dialog.accept() : dialog.dismiss());
      resolve(message);
    });
  });
}

/**
 * Records every window.confirm shown from now on, accepting each, and returns
 * the array it fills. Use it to assert how many were asked, which is how a
 * suppressed confirm is told apart from one that never fired.
 */
export function recordConfirms(page: Page): string[] {
  const messages: string[] = [];
  page.on("dialog", async (dialog) => {
    messages.push(dialog.message());
    await dialog.accept();
  });
  return messages;
}
