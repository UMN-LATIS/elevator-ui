import { Hono } from "hono";
import { delay } from "../utils/index";
import type { MockServerContext } from "../types";
import { PERMISSION_LEVELS } from "../db/permissionLevels";

const app = new Hono<MockServerContext>();

// GET /permissions/permissionLevels: the level catalog, sorted by level
// like the real endpoint
app.get("/permissionLevels", async (c) => {
  await delay(100);

  const permissionLevels = [...PERMISSION_LEVELS].sort(
    (a, b) => a.level - b.level
  );

  return c.json({ permissionLevels });
});

export default app;
