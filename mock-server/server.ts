import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { MockServerContext, SessionData } from "./types.js";

import assetRoutes from "./routes/assets.js";
import searchRoutes from "./routes/search.js";
import drawerRoutes from "./routes/drawers.js";
import authRoutes from "./routes/auth.js";
import fileRoutes from "./routes/files.js";
import miscRoutes from "./routes/misc.js";
import instanceRoutes from "./routes/instance.js";

const app = new Hono<MockServerContext>();

// In-memory session store for testing
const sessions = new Map<string, SessionData>();

// Middleware
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "https://localhost:5173"],
    credentials: true,
  })
);
app.use("*", logger());

// Session middleware - attach session data to context
app.use("*", async (c, next) => {
  const sessionId = getCookie(c, "ci_session");
  const sessionData = sessionId ? sessions.get(sessionId) : undefined;
  c.set("session", sessionData || null);
  c.set("sessionId", sessionId || undefined);
  c.set("sessions", sessions);
  await next();
});

// Routes - defaultinstance prefix to match real API structure
app.route("/defaultinstance/asset", assetRoutes);
app.route("/defaultinstance/search", searchRoutes);
app.route("/defaultinstance/drawers", drawerRoutes);
app.route("/defaultinstance/loginManager", authRoutes);
app.route("/defaultinstance/fileManager", fileRoutes);
app.route("/defaultinstance/assetManager", assetRoutes);
app.route("/defaultinstance/collections", miscRoutes);
app.route("/defaultinstance/home", instanceRoutes);
app.route("/defaultinstance/page", miscRoutes);
app.route("/defaultinstance/api/v1", miscRoutes);
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
