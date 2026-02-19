import { Hono } from "hono";
import type { MockServerContext } from "../types";
import { InstanceSettings } from "../../src/types/index";
import { parseFormData } from "../utils";
import { makeInstance } from "../db/instances";

const app = new Hono<MockServerContext>({ strict: false });

// GET /instances/getInstance/:instanceId
app.get("/getInstance/:instanceId", (c) => {
  const db = c.get("db");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (!user?.isInstanceAdmin && !user?.isSuperAdmin) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const instance = db.instances.getDefault();
  return c.json(instance);
});

// POST /instances/save/true
app.post("/save/:json", async (c) => {
  const db = c.get("db");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (!user.isInstanceAdmin && !user.isSuperAdmin) {
    return c.json({ error: "Forbidden" }, 403);
  }

  // convert form data to object
  const formRaw = await c.req.formData();
  const form = parseFormData(formRaw);

  const instanceId = form.instanceId;
  if (typeof instanceId !== "number") {
    return c.json({ error: "Invalid instanceId" }, 400);
  }

  // get instance by id
  const instance = db.instances.get(instanceId);

  if (!instance) {
    return c.json({ error: "Instance not found" }, 404);
  }

  const defaults = makeInstance();
  const updated: InstanceSettings = {
    ...defaults,
    ...instance,
    ...form,

    // handle booleans
    showPreviousNextSearchResults: Boolean(form.showPreviousNextSearchResults),
    showCollectionInSearchResults: Boolean(form.showCollectionInSearchResults),
    showTemplateInSearchResults: Boolean(form.showTemplateInSearchResults),
    useVoyagerViewer: Boolean(form.useVoyagerViewer),
    useCustomCSS: Boolean(form.useCustomCSS),
    allowIndexing: Boolean(form.allowIndexing),
    hideVideoAudio: Boolean(form.hideVideoAudio),
    autoloadMaxSearchResults: Boolean(form.autoloadMaxSearchResults),
    enableInterstitial: Boolean(form.enableInterstitial),
    enableHLSStreaming: Boolean(form.enableHLSStreaming),
    enableTheming: Boolean(form.enableTheming),
    useCentralAuth: Boolean(form.useCentralAuth),
    automaticAltText: Boolean(form.automaticAltText),
  };

  db.instances.set(updated.instanceId, updated);

  return c.json({ success: true, message: "Instance settings saved" });
});

export default app;
