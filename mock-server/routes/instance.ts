import { Hono } from "hono";
import { delay } from "../utils";
import { instanceUnauthed, instanceAuthed } from "../fixtures/instance";
import type { MockServerContext } from "../types.js";

const app = new Hono<MockServerContext>();

// GET /home/getInstanceNav
app.get("/getInstanceNav", async (c) => {
  await delay(150);
  
  const session = c.get("session");
  
  if (session) {
    console.log(`Instance nav requested for authenticated user: ${session.username}`);
    // Return authenticated instance with user data
    const instance = {
      ...instanceAuthed,
      userId: session.userId,
      userDisplayName: session.username,
      userIsAdmin: session.isAdmin || false,
      userIsSuperAdmin: session.isAdmin || false,
    };
    return c.json(instance);
  } else {
    console.log("Instance nav requested for unauthenticated user");
    return c.json(instanceUnauthed);
  }
});

export default app;
