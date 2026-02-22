import { Hono } from "hono";
import type { MockServerContext } from "../types";
import { parseFormData } from "../utils";
import type { CustomPageSummary, SavePageApiResponse } from "../../src/types";

const app = new Hono<MockServerContext>({ strict: false });

const requireAdmin = (user: MockServerContext["Variables"]["user"]) =>
  !user?.isInstanceAdmin && !user?.isSuperAdmin;

// GET /instances/customPages/true
app.get("/customPages/:json", (c) => {
  const user = c.get("user");

  if (!user) return c.json({ error: "Unauthorized" }, 401);
  if (requireAdmin(user)) return c.json({ error: "Forbidden" }, 403);

  const db = c.get("db");
  const pages = db.customPages.getAll();

  const response: CustomPageSummary[] = pages.map((page) => ({
    id: page.id,
    title: page.title,
    body: page.body,
    includeInHeader: page.includeInHeader,
    parentId: page.parentId,
    parentTitle: db.customPages.getParentTitle(page.parentId),
    createdAt: page.createdAt,
    modifiedAt: page.modifiedAt ?? undefined,
  }));

  return c.json(response);
});

// GET /instances/getPage/:pageId
app.get("/getPage/:pageId", (c) => {
  const user = c.get("user");

  if (!user) return c.json({ error: "Unauthorized" }, 401);
  if (requireAdmin(user)) return c.json({ error: "Forbidden" }, 403);

  const db = c.get("db");
  const pageId = Number(c.req.param("pageId"));
  const page = db.customPages.get(pageId);

  if (!page) return c.json({ error: "Page not found" }, 404);

  const response: CustomPageSummary = {
    id: page.id,
    title: page.title,
    body: page.body,
    includeInHeader: page.includeInHeader,
    parentId: page.parentId,
    parentTitle: db.customPages.getParentTitle(page.parentId),
    createdAt: page.createdAt,
    modifiedAt: page.modifiedAt ?? undefined,
  };

  return c.json(response);
});

// POST /instances/savePage/true
app.post("/savePage/:json", async (c) => {
  const user = c.get("user");

  if (!user) return c.json({ error: "Unauthorized" }, 401);
  if (requireAdmin(user)) return c.json({ error: "Forbidden" }, 403);

  const db = c.get("db");
  const formRaw = await c.req.formData();
  const form = parseFormData(formRaw);

  const title = typeof form.title === "string" ? form.title : "";
  const body = typeof form.body === "string" ? form.body : "";
  const includeInHeader = Boolean(form.includeInHeader);
  const parentId =
    form.parent !== undefined && form.parent !== null
      ? Number(form.parent)
      : null;

  const pageId = form.pageId !== undefined ? Number(form.pageId) : undefined;

  let page;
  if (pageId) {
    page = db.customPages.update(pageId, {
      title,
      body,
      includeInHeader,
      parentId,
    });
    if (!page) return c.json({ error: "Page not found" }, 404);
  } else {
    page = db.customPages.create({
      title,
      body,
      includeInHeader,
      parentId,
      sortOrder: null,
    });
  }

  const response: SavePageApiResponse = {
    id: page.id,
    title: page.title,
    body: page.body,
    includeInHeader: page.includeInHeader,
    sortOrder: page.sortOrder,
    parentId: page.parentId,
    modifiedAt: page.modifiedAt,
  };

  return c.json(response);
});

// DELETE /instances/deletePage/:pageId/true
app.delete("/deletePage/:pageId/:json", (c) => {
  const user = c.get("user");

  if (!user) return c.json({ error: "Unauthorized" }, 401);
  if (requireAdmin(user)) return c.json({ error: "Forbidden" }, 403);

  const db = c.get("db");
  const pageId = Number(c.req.param("pageId"));
  const page = db.customPages.get(pageId);

  if (!page) return c.json({ error: "Page not found" }, 404);

  db.customPages.delete(pageId);

  return c.json({ success: true });
});

export default app;
