import { Hono } from "hono";
import { delay } from "../utils/index";
import { db } from "../db/index.js";
import type { MockServerContext } from "../types";

const app = new Hono<MockServerContext>();

// GET /drawers/listDrawers/true
app.get("/listDrawers/true", async (c) => {
  await delay(200);
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

export default app;
