import { Hono } from "hono";
import { delay } from "../utils/index";
import { db } from "../db/index";
import { StaticContentPage } from "../../src/types";
import type { MockServerContext } from "../types";

const app = new Hono<MockServerContext>();

app.get("/view/:pageId/true", async (c) => {
  await delay(100);
  const pageId = Number(c.req.param("pageId"));

  const page = db.pages.get(pageId);
  if (!page) {
    return c.json({ error: "Page not found" }, 404);
  }

  return c.json<StaticContentPage>(page);
});

export default app;
