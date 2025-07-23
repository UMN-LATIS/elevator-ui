import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { getCookie } from "hono/cookie";
import type { MockServerContext } from "./types";
import { db } from "./db/index";

import assetRoutes from "./routes/assets.js";
import searchRoutes from "./routes/search.js";
import drawerRoutes from "./routes/drawers.js";
import authRoutes from "./routes/auth.js";
import fileRoutes from "./routes/files.js";
import pageRoutes from "./routes/pages.js";
import instanceRoutes from "./routes/instance.js";

const app = new Hono<MockServerContext>();

// Middleware
app.use(
  "*",
  cors({
    origin: ["*"],
    credentials: true,
  })
);
app.use("*", logger());

// Auth and user middleware
app.use("*", async (c, next) => {
  const sessionId = getCookie(c, "ci_session");

  let user = null;
  let session = null;

  if (sessionId) {
    // Look up session and user from db
    session = db.sessions.get(sessionId);
    if (session) {
      user = db.users.get(session.userId);
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
app.route("/defaultinstance/s3", fileRoutes);

// Health check
app.get("/health", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString() })
);

const port = 3001;
console.log(`🚀 Mock server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
