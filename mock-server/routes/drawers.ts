import { Hono } from "hono";
import { delay, assetToSearchResultMatch } from "../utils/index";
import type { MockServerContext } from "../types";

const app = new Hono<MockServerContext>();

// GET /drawers/listDrawers/true
app.get("/listDrawers/true", async (c) => {
  await delay(200);
  const db = c.get("db");
  const user = c.get("user");

  if (!user) {
    return c.json([], 200);
  }

  console.log(`Drawers requested for user ${user.username}`);
  const userDrawers = db.drawers.getByUserId(user.id);

  // Convert to API format - object with drawer IDs as keys
  const drawersList = userDrawers.reduce((acc, drawer) => {
    acc[drawer.id.toString()] = {
      title: drawer.name,
    };
    return acc;
  }, {} as Record<string, { title: string }>);

  return c.json(drawersList);
});

app.get("/getDrawer/:drawerId", async (c) => {
  await delay(200);
  const db = c.get("db");
  const drawerId = Number.parseInt(c.req.param("drawerId"));
  const drawer = db.drawers.get(drawerId);
  if (!drawer) {
    return c.json({ error: "Drawer not found" }, 404);
  }
  const matches = drawer.assetIds.flatMap((assetId) => {
    const asset = db.assets.get(assetId);
    if (!asset) return [];
    const collection = db.collections.get(asset.collectionId);
    const template = db.templates.get(asset.templateId);
    if (!collection || !template) return [];
    return [assetToSearchResultMatch({ asset, collection, template })];
  });

  const response = {
    searchResults: matches.map((m) => m.objectId),
    matches,
    success: true,
    searchEntry: { searchText: "" },
    totalResults: matches.length,
    drawerId: drawer.id,
    drawerTitle: drawer.name,
    drawerDescription: drawer.description || "",
    sortBy: "title.raw",
  };
  console.log(`Drawer requested: ${drawer.name} (${drawer.id})`);

  return c.json(response);
});
export default app;
