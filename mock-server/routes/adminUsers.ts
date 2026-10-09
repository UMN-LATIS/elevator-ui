import { Hono } from "hono";
import { delay } from "../utils/index";
import type { MockServerContext, MockUser } from "../types";
import type { AdminUser } from "../../src/types";

const app = new Hono<MockServerContext>();

const PER_PAGE_CHOICES = [25, 50, 100];
const DEFAULT_PER_PAGE = 100;

function toAdminUser(user: MockUser): AdminUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email ?? null,
    emplid: user.emplid ?? null,
    userType: user.userType ?? "Local",
    isSuperAdmin: user.isSuperAdmin,
    hasExpiry: user.hasExpiry ?? false,
    expires: user.expires ?? null,
    createdAt: user.createdAt ?? null,
    instance: user.instance ?? null,
  };
}

function toPage(rawPage: string | undefined): number {
  const page = Number(rawPage);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function toPerPage(rawPerPage: string | undefined): number {
  const perPage = Number(rawPerPage);
  return PER_PAGE_CHOICES.includes(perPage) ? perPage : DEFAULT_PER_PAGE;
}

app.use("*", async (c, next) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  if (!user.isSuperAdmin) {
    return c.json({ error: "Forbidden" }, 403);
  }

  await next();
});

app.get("/users", async (c) => {
  await delay(100);
  const db = c.get("db");
  const search = (c.req.query("search") ?? "").trim().toLowerCase();
  const userType = c.req.query("userType");
  const isSuperAdmin = c.req.query("isSuperAdmin");

  const errors: Record<string, string[]> = {};
  if (userType !== undefined && userType !== "Local" && userType !== "Remote") {
    errors.userType = ["Must be Local or Remote."];
  }
  if (
    isSuperAdmin !== undefined &&
    isSuperAdmin !== "true" &&
    isSuperAdmin !== "false"
  ) {
    errors.isSuperAdmin = ["Must be true or false."];
  }
  if (Object.keys(errors).length > 0) {
    return c.json({ errors }, 422);
  }

  const matchesSearch = (user: AdminUser): boolean =>
    [user.displayName, user.username, user.email, user.emplid].some((field) =>
      field?.toLowerCase().includes(search)
    );

  const matchingUsers = db.users
    .getAll()
    .map(toAdminUser)
    .filter((user) => search === "" || matchesSearch(user))
    .filter((user) => userType === undefined || user.userType === userType)
    .filter(
      (user) =>
        isSuperAdmin === undefined || String(user.isSuperAdmin) === isSuperAdmin
    )
    .sort((left, right) => right.id - left.id);

  const page = toPage(c.req.query("page"));
  const perPage = toPerPage(c.req.query("perPage"));
  const firstIndex = (page - 1) * perPage;

  return c.json({
    users: matchingUsers.slice(firstIndex, firstIndex + perPage),
    page,
    perPage,
    total: matchingUsers.length,
  });
});

export default app;
