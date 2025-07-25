import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { delay } from "../utils/index";
import type { MockServerContext } from "../types.js";

const app = new Hono<MockServerContext>();

// POST /loginManager/localLoginAsync
app.post("/localLoginAsync", async (c) => {
  await delay(400);
  const db = c.get("db");
  const formData = await c.req.formData();
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  console.log(`Login attempt: ${username}`);

  // Find user by username
  const user = db.users.getByUsername(username);

  if (!user) {
    return c.json(
      {
        status: "error",
        message: "Invalid username or password",
      },
      401
    );
  }

  // Check password
  if (user.password !== password) {
    return c.json(
      {
        status: "error",
        message: "Invalid username or password",
      },
      401
    );
  }

  // Create session for authenticated user
  const session = db.sessions.create(user.id);

  // Set session cookie
  setCookie(c, "ci_session", session.id, {
    httpOnly: true,
    secure: false, // Allow HTTP for local development
    sameSite: "Lax",
    path: "/",
  });

  return c.json({ status: "success", message: "login successful" });
});

// POST /loginManager/logout
app.post("/logout", async (c) => {
  await delay(200);
  const db = c.get("db");
  const session = c.get("session");
  const { sessions } = db;

  // Remove session from store
  if (session?.id) {
    sessions.delete(session.id);
    console.log(`Session ${session.id} removed on logout`);
  }

  // Clear session cookie
  deleteCookie(c, "ci_session", {
    path: "/",
  });

  return c.json({
    status: "success",
    message: "Logged out successfully",
  });
});

export default app;
