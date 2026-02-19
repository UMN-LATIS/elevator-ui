import { Hono } from "hono";
import type { MockServerContext } from "../types";
import { InstanceSettings } from "../../src/types/index";
import { parseFormData } from "../utils";

const app = new Hono<MockServerContext>({ strict: false });

// GET /instances/getInstance/:instanceId
app.get("/getInstance/:instanceId", (c) => {
  const db = c.get("db");
  const user = c.get("user");

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

  if (!user?.isInstanceAdmin && !user?.isSuperAdmin) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const rawFormData = await c.req.formData();
  const formData = parseFormData(rawFormData);
  const instanceId = Number(formData.instanceId);

  const instance = db.instances.get(instanceId);
  if (!instance) return c.json({ error: "Instance not found" }, 404);

  const updated: InstanceSettings = { ...instance };

  const name = rawFormData.get("name");
  if (typeof name === "string") updated.name = name;

  const featuredAsset = rawFormData.get("featuredAsset");
  if (typeof featuredAsset === "string")
    updated.featuredAsset = featuredAsset || null;

  const featuredAssetText = rawFormData.get("featuredAssetText");
  if (typeof featuredAssetText === "string")
    updated.featuredAssetText = featuredAssetText || null;

  const useCustomHeader = rawFormData.get("useCustomHeader");
  if (useCustomHeader !== null)
    updated.useCustomHeader = Number(useCustomHeader) as 0 | 1 | 2;

  const customHeaderText = rawFormData.get("customHeaderText");
  if (customHeaderText !== null)
    updated.customHeaderText =
      typeof customHeaderText === "string" ? customHeaderText || null : null;

  const customFooterText = rawFormData.get("customFooterText");
  if (customFooterText !== null)
    updated.customFooterText =
      typeof customFooterText === "string" ? customFooterText || null : null;

  const showCollectionInSearchResults = rawFormData.get(
    "showCollectionInSearchResults"
  );
  if (showCollectionInSearchResults !== null)
    updated.showCollectionInSearchResults =
      showCollectionInSearchResults === "1";

  const showTemplateInSearchResults = rawFormData.get(
    "showTemplateInSearchResults"
  );
  if (showTemplateInSearchResults !== null)
    updated.showTemplateInSearchResults = showTemplateInSearchResults === "1";

  const useVoyagerViewer = rawFormData.get("useVoyagerViewer");
  if (useVoyagerViewer !== null)
    updated.useVoyagerViewer = useVoyagerViewer === "1";

  const useCustomCSS = rawFormData.get("useCustomCSS");
  if (useCustomCSS !== null) updated.useCustomCSS = useCustomCSS === "1";

  db.instances.set(updated.instanceId, updated);

  return c.json({ success: true, message: "Instance settings saved" });
});

export default app;
