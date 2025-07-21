import { Hono } from "hono";
import { loadFixture, parseFormData, delay } from "../utils/fixtures.js";

const app = new Hono();
const misc = loadFixture("misc.json");

// POST /loginManager/localLoginAsync
app.post("/localLoginAsync", async (c) => {
  await delay(400);
  const formData = await c.req.formData();
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  console.log(`Login attempt: ${username}`);

  // Simple auth logic for testing
  if (username === "testuser" && password === "password") {
    return c.json(misc.loginResponse);
  } else if (username === "admin" && password === "admin") {
    return c.json({
      ...misc.loginResponse,
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
  return c.json({
    status: "success",
    message: "Logged out successfully",
  });
});

export default app;
