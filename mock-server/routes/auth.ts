import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { delay } from "../utils/index";
import loginResponse from "../fixtures/login";
import type { MockServerContext, SessionData } from "../types.js";

const app = new Hono<MockServerContext>();

// POST /loginManager/localLoginAsync
app.post("/localLoginAsync", async (c) => {
  await delay(400);
  const formData = await c.req.formData();
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  console.log(`Login attempt: ${username}`);

  const sessions = c.get("sessions");

  // Simple auth logic for testing
  if (username === "testuser" && password === "password") {
    // Create session
    const sessionId = crypto.randomUUID();
    const userData = { userId: "user_1", username: "testuser" };
    sessions.set(sessionId, userData);
    
    // Set session cookie
    setCookie(c, "ci_session", sessionId, {
      httpOnly: true,
      secure: false, // Allow HTTP for local development
      sameSite: "Lax",
      path: "/",
    });

    return c.json(loginResponse);
  } else if (username === "admin" && password === "admin") {
    // Create admin session
    const sessionId = crypto.randomUUID();
    const userData = { userId: "admin_1", username: "admin", isAdmin: true };
    sessions.set(sessionId, userData);
    
    // Set session cookie
    setCookie(c, "ci_session", sessionId, {
      httpOnly: true,
      secure: false, // Allow HTTP for local development
      sameSite: "Lax",
      path: "/",
    });

    return c.json({
      ...loginResponse,
      user: {
        username: "admin",
        isAdmin: true,
      },
    });
  } else {
    // Return 401 for bad credentials
    return c.json(
      {
        status: "error",
        message: "Invalid username or password",
      },
      401
    );
  }
});

// POST /loginManager/logout
app.post("/logout", async (c) => {
  await delay(200);
  
  const sessionId = c.get("sessionId") as string;
  const sessions = c.get("sessions");
  
  // Remove session from store
  if (sessionId) {
    sessions.delete(sessionId);
    console.log(`Session ${sessionId} removed on logout`);
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
