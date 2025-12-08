import fs from "node:fs";
import { createServer } from "node:https";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { getCookie, setCookie } from "hono/cookie";
import { serveStatic } from "@hono/node-server/serve-static";
import type { MockServerContext } from "./types";
import { db, getOrCreateWorkerDb } from "./db/index";

import assetRoutes from "./routes/assets";
import searchRoutes from "./routes/search";
import drawerRoutes from "./routes/drawers";
import authRoutes from "./routes/auth";
import fileRoutes from "./routes/files";
import pageRoutes from "./routes/pages";
import instanceRoutes from "./routes/instance";
import s3Routes from "./routes/s3";
import config from "./config";

const app = new Hono<MockServerContext>({ strict: false });

// Middleware
app.use(
  "*",
  cors({
    origin: "*", // Allow all origins
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "x-worker-id",
      "Accept",
      "Origin",
      "X-Requested-With",
    ],
    // exposeHeaders: ["ETag", "Content-Length", "Content-Type"],
  })
);
app.use("*", logger());

// Static file serving for frontend build
app.use("/assets/*", serveStatic({ root: "../dist" }));
app.use("*", serveStatic({ root: "../dist" }));

// Auth and user middleware
app.use("*", async (c, next) => {
  const sessionId = getCookie(c, "ci_session");
  const workerId = c.req.header("x-worker-id") || "default";
  console.log(`Worker ID: ${workerId}, Session ID: ${sessionId}`);

  // Playwright tests run in parallel, so we need to permit worker-specific
  // databases to avoid conflicts.
  // - The client should set the `x-worker-id` header to the worker id to
  // ensure the correct database is used.
  // - If no worker id is provided, use the default database.
  // - set the correct db on the context
  // - IMPORTANT: use the context to access the db in routes, rather
  // than importing the db directly.
  const workerDb = workerId === "default" ? db : getOrCreateWorkerDb(workerId);
  c.set("db", workerDb);

  let user = null;
  let session = null;

  if (sessionId) {
    // Look up session in the appropriate database
    session = workerDb.sessions.get(sessionId);
    if (session) {
      user = workerDb.users.get(session.userId);
    }
  }

  c.set("user", user || null);

  await next();
});

// Routes - defaultinstance prefix to match real API structure
app.route("/defaultinstance/asset", assetRoutes);
app.route("/defaultinstance/search", searchRoutes);
app.route("/defaultinstance/drawers", drawerRoutes);
app.route("/defaultinstance/loginManager", authRoutes);
app.route("/defaultinstance/fileManager", fileRoutes);
app.route("/defaultinstance/assetManager", assetRoutes);
app.route("/defaultinstance/home", instanceRoutes);
app.route("/defaultinstance/page", pageRoutes);
app.route("/defaultinstance/s3", s3Routes);
// Also mount s3 routes at root level for signed URL handling
app.route("/s3", s3Routes);

// Test utility routes
app.post("/_tests/db/refresh", (c) => {
  const db = c.get("db");

  // Reset all tables first
  Object.values(db).forEach((table) => table.reset());

  // Then seed all tables
  Object.values(db).forEach((table) => table.seed());

  return c.json({ success: true, message: "Database reset and seed" });
});

app.post("/_tests/auth/login", async (c) => {
  const db = c.get("db");
  const { username = "user" } = await c.req.json();

  // Find user in worker-specific db
  const user = db.users.getByUsername(username);
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Create session
  const session = db.sessions.create(user.id);

  // Set session cookie
  setCookie(c, "ci_session", session.id, {
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
    path: "/",
  });

  return c.json({ sessionId: session.id, user });
});

app.patch("/_tests/instance/update", async (c) => {
  const db = c.get("db");
  const updates = await c.req.json();

  const instance = db.instances.getDefault();
  if (!instance) {
    return c.json({ error: "Instance not found" }, 404);
  }

  // Merge updates into existing instance
  const updatedInstance = { ...instance, ...updates };
  db.instances.set(instance.id, updatedInstance);

  return c.json({ success: true, instance: updatedInstance });
});

// Health check
app.get("/health", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString() })
);

// SPA fallback - serve index.html for all unmatched routes
app.get("*", serveStatic({ path: "../dist/index.html" }));

console.log(`🚀 Mock server running on ${config.ORIGIN}:${config.PORT}`);

serve({
  fetch: app.fetch,
  port: config.PORT,
  // createServer: createServer,
  // serverOptions: {
  //   cert: fs.readFileSync("../.cert/cert.pem"),
  //   key: fs.readFileSync("../.cert/key.pem"),
  // },
});
