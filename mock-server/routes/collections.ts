import { Hono } from "hono";
import { delay } from "../utils/index";
import { MockServerContext } from "../types";

const app = new Hono<MockServerContext>();

// GET /collections/collectionHeader/:collectionId/true
app.get("/collectionHeader/:collectionId/true", async (c) => {
  await delay(100);
  const db = c.get("db");
  const collectionId = Number(c.req.param("collectionId"));
  const collection = db.collections.get(collectionId);

  if (!collection) {
    return c.json({ error: "Collection not found" }, 404);
  }

  return c.json({
    collectionDescription: "",
    collectionTitle: collection.title,
  });
});

export default app;
