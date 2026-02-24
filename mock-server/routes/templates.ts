import { Hono } from "hono";
import type { MockServerContext } from "../types";
import type { TemplateSummary } from "../../src/types";

const app = new Hono<MockServerContext>({ strict: false });

// GET /templates — mirrors Templates::index() JSON path
app.get("/", (c) => {
  const user = c.get("user");

  if (!user) return c.json({ error: "Unauthorized" }, 401);
  if (!user.isInstanceAdmin && !user.isSuperAdmin)
    return c.json({ error: "Forbidden" }, 403);

  const db = c.get("db");

  const response: TemplateSummary[] = db.templates.getAll().map((t) => ({
    id: t.templateId,
    name: t.templateName,
  }));

  return c.json(response);
});

export default app;
