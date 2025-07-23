import { type APIRequestContext, type Page } from "@playwright/test";

const MOCK_SERVER_PORT = 3001;
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
  const response = await request.post(
    `http://localhost:${MOCK_SERVER_PORT}/_tests/db/refresh`,
    {
      headers: { "x-worker-id": workerId },
    }
  );

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
  const response = await request.post(
    `http://localhost:${MOCK_SERVER_PORT}/_tests/auth/login`,
    {
      data: { username },
      headers: { "x-worker-id": workerId },
    }
  );

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
