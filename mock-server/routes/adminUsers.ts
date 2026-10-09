import { Hono } from "hono";
import { delay } from "../utils/index";
import type { MockServerContext, MockUser } from "../types";
import type { AdminUser } from "../../src/types";

const app = new Hono<MockServerContext>();

const PER_PAGE_OPTIONS = [25, 50, 100];
const DEFAULT_PER_PAGE = 25;

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

function parsePage(rawPage: string | undefined): number {
  const page = Number(rawPage);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function parsePerPage(rawPerPage: string | undefined): number {
  const perPage = Number(rawPerPage);
  return PER_PAGE_OPTIONS.includes(perPage) ? perPage : DEFAULT_PER_PAGE;
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
  const rawIsSuperAdmin = c.req.query("isSuperAdmin");

  const errors: Record<string, string[]> = {};
  const isKnownUserType =
    userType === undefined ||
    ["Local", "Remote", "Remote-Guest"].includes(userType);
  if (!isKnownUserType) {
    errors.userType = ["Must be Local, Remote, or Remote-Guest."];
  }
  if (
    rawIsSuperAdmin !== undefined &&
    rawIsSuperAdmin !== "true" &&
    rawIsSuperAdmin !== "false"
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

  const matchesUserType = (user: AdminUser): boolean =>
    userType === undefined || user.userType === userType;

  const matchesSuperAdminFilter = (user: AdminUser): boolean =>
    rawIsSuperAdmin === undefined ||
    user.isSuperAdmin === (rawIsSuperAdmin === "true");

  const matchingUsers = db.users
    .getAll()
    .map(toAdminUser)
    .filter((user) => search === "" || matchesSearch(user))
    .filter(matchesUserType)
    .filter(matchesSuperAdminFilter)
    .sort((left, right) => right.id - left.id);

  const page = parsePage(c.req.query("page"));
  const perPage = parsePerPage(c.req.query("perPage"));
  const firstIndex = (page - 1) * perPage;

  return c.json({
    users: matchingUsers.slice(firstIndex, firstIndex + perPage),
    page,
    perPage,
    total: matchingUsers.length,
  });
});

export default app;
