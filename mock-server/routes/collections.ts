import { Hono } from "hono";
import { delay } from "../utils/index";
import type { MockServerContext } from "../types";

const app = new Hono<MockServerContext>();

// GET /collections/collectionHeader/:collectionId/true
// Returns the collection description (used by instanceStore on asset views).
app.get("/collectionHeader/:collectionId/true", async (c) => {
  await delay(100);
  const db = c.get("db");
  const collectionId = Number(c.req.param("collectionId"));
  const collection = db.collections.get(collectionId);

  return c.json({
    collectionDescription: collection
      ? `Mock description for ${collection.title}`
      : "",
  });
});

export default app;
