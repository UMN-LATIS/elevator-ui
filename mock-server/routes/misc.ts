import { Hono } from "hono";
import { loadFixture, delay } from "../utils/fixtures.js";

const app = new Hono();
const misc = loadFixture("misc.json");

// GET /collections/collectionHeader/:collectionId/true
app.get("/collectionHeader/:collectionId/true", async (c) => {
  await delay(100);
  return c.json(misc.collectionDescription);
});

// GET /home/getInstanceNav
app.get("/getInstanceNav", async (c) => {
  await delay(150);
  console.log("Instance nav requested for: defaultinstance");
  return c.json(misc.instanceNav);
});

// GET /home/interstitial
app.get("/interstitial", async (c) => {
  await delay(100);
  return c.json(misc.interstitial);
});

// GET /page/view/:pageId/true
app.get("/view/:pageId/true", async (c) => {
  await delay(100);
  const pageId = Number(c.req.param("pageId"));
  return c.json({ ...misc.staticPage, pageId });
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
