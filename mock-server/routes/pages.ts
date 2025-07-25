import { Hono } from "hono";
import { delay } from "../utils/index";
import { StaticContentPage } from "../../src/types";
import type { MockServerContext } from "../types";

const app = new Hono<MockServerContext>();

app.get("/view/:pageId/true", async (c) => {
  await delay(100);
  const db = c.get("db");

  const pageId = Number(c.req.param("pageId"));

  const page = db.pages.get(pageId);
  if (!page) {
    return c.json({ error: "Page not found" }, 404);
  }

  return c.json<StaticContentPage>(page);
});

export default app;
