import { Hono } from "hono";
import { delay } from "../utils/index";
import { db } from "../db/index.js";
import { StaticContentPage } from "../../src/types";
import type { MockServerContext } from "../types.js";

const app = new Hono<MockServerContext>();

// GET /collections/collectionHeader/:collectionId/true
app.get("/collectionHeader/:collectionId/true", async (c) => {
  await delay(100);
  const collectionId = Number(c.req.param("collectionId"));
  const collection = db.collections.getHeader(collectionId);
  return c.json(collection);
});

// GET /home/interstitial
app.get("/interstitial", async (c) => {
  await delay(100);
  return c.json({
    showInterstitial: false,
    message: "Welcome to the digital repository",
  });
});

// GET /page/view/:pageId/true
app.get("/view/:pageId/true", async (c) => {
  await delay(100);
  const pageId = Number(c.req.param("pageId"));

  const page = db.pages.get(pageId);
  if (page) {
    return c.json<StaticContentPage>(page);
  }

  // Generate a default page if not found
  const defaultPage: StaticContentPage = {
    id: pageId,
    title: `Page ${pageId}`,
    content: `<p>Content for page ${pageId}</p>`,
  };

  return c.json<StaticContentPage>(defaultPage);
});

// Click-to-search endpoints
// These are dynamic URLs, so we'll handle them with a wildcard
app.get("/clickToSearch/*", async (c) => {
  await delay(200);
  const path = c.req.path;

  // Extract searchId from the URL - in real app this would be more complex
  const searchId = `click_search_${Date.now()}`;

  if (path.endsWith("/true")) {
    // Return just searchId for JSON requests
    return c.json({ searchId });
  } else {
    // Return HTML page (not used in this context, but for completeness)
    return c.html(
      `<html><body>Click to search results for ${path}</body></html>`
    );
  }
});

// LTI endpoints
// POST /api/v1/lti/ltiPayload
app.post("/lti/ltiPayload", async (c) => {
  await delay(300);
  const formData = await c.req.formData();
  const object = formData.get("object") as string;
  const excerptId = formData.get("excerptId") as string;
  const returnUrl = formData.get("returnUrl") as string;

  console.log(`LTI payload for object ${object}, excerpt ${excerptId}`);

  return c.json({
    success: true,
    ltiUrl: `https://mock-lti.example.com/launch?object=${object}&excerpt=${excerptId}`,
    returnUrl,
  });
});

// POST /api/v1/lti13/ltiPayload
app.post("/lti13/ltiPayload", async (c) => {
  await delay(300);
  const formData = await c.req.formData();
  const object = formData.get("object") as string;
  const excerptId = formData.get("excerptId") as string;
  const launchId = formData.get("launchId") as string;
  const userId = formData.get("userId") as string;

  console.log(`LTI 1.3 payload for object ${object}, user ${userId}`);

  return c.json({
    success: true,
    ltiUrl: `https://mock-lti13.example.com/launch?object=${object}&excerpt=${excerptId}&launch=${launchId}`,
    launchId,
    userId,
  });
});

export default app;
