import { Hono } from "hono";
import { parseFormData, delay } from "../utils/index";
import { MockServerContext, type AssetFormData } from "../types";
import { Asset, TextWidgetContent } from "../../src/types";

const app = new Hono<MockServerContext>();

// GET /asset/viewAsset/:assetId/true
app.get("/viewAsset/:assetId/true", async (c) => {
  await delay(200);
  const db = c.get("db");
  const assetId = c.req.param("assetId");
  const asset = db.assets.get(assetId);
  if (!asset) {
    return c.json({ error: "Asset not found" }, 404);
  }
  return c.json(asset);
});

// GET /asset/getAssetPreview/:assetId
app.get("/getAssetPreview/:assetId", async (c) => {
  await delay(100);
  const db = c.get("db");
  const assetId = c.req.param("assetId");
  const assetPreview = db.assets.getPreview(assetId);

  if (!assetPreview) {
    return c.json({ error: "Asset not found" }, 404);
  }

  return c.json(assetPreview);
});

// GET /assetManager/getTemplate/:templateId
app.get("/getTemplate/:templateId", async (c) => {
  await delay(100);
  const db = c.get("db");
  const templateId = c.req.param("templateId");

  const template = db.templates.get(Number(templateId));
  if (!template) {
    return c.json({ error: "Template not found" }, 404);
  }
  return c.json(template);
});

// POST /assetManager/submission/true (create/update asset)
app.post("/submission/true", async (c) => {
  await delay(500);
  const db = c.get("db");
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const rawFormData = await c.req.formData();
  // all the data sits on the `formData` property
  const { formData } = parseFormData(rawFormData) as {
    formData: AssetFormData;
  };

  // convert collectionId and templateId to numbers
  formData.collectionId = Number(formData.collectionId);
  formData.templateId = Number(formData.templateId);

  if (
    Number.isNaN(formData.collectionId) ||
    Number.isNaN(formData.templateId)
  ) {
    return c.json(
      { error: "valid templateId and collectionId are required" },
      400
    );
  }

  const titleWidgets = formData.title_1 as TextWidgetContent[];
  const titleWidget = titleWidgets?.[0];

  const asset: Omit<Asset, "createdBy"> = {
    ...formData,
    assetId: formData.objectId,
    title: [titleWidget?.fieldContents || "(Untitled)"],
    templateId: formData.templateId,
    collectionId: formData.collectionId,
    modified: {
      date: new Date().toISOString(),
      timezone_type: 3,
      timezone: "UTC",
    },
    modifiedBy: user.id,
  };

  const savedAsset = formData.objectId
    ? db.assets.update(formData.objectId, asset)
    : db.assets.create({
        ...asset,
        createdBy: user.id,
      } as Asset);

  if (!savedAsset) {
    return c.json({ error: "Asset not found" }, 404);
  }
  return c.json({
    success: true,
    objectId: savedAsset.assetId,
  });
});

export default app;
