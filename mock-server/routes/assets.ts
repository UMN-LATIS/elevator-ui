import { Hono } from "hono";
import { parseFormData, delay } from "../utils/index";
import fileDownloads from "../fixtures/file-downloads";
import excerpt from "../fixtures/excerpt";
import template from "../fixtures/template";
import { assetData, mockAssets, getAssetById, mockAssetSummaries } from "../fixtures/assets";
import type { AssetFormData } from "../types";

const app = new Hono();

// GET /asset/viewAsset/:assetId/true
app.get("/viewAsset/:assetId/true", async (c) => {
  await delay(200);
  const assetId = c.req.param("assetId");
  const asset = getAssetById(assetId);
  if (asset) {
    return c.json(asset);
  }
  // Fallback to sample asset if specific asset not found
  return c.json({ ...assetData.sampleAsset, assetId });
});

// GET /asset/getAssetPreview/:assetId
app.get("/getAssetPreview/:assetId", async (c) => {
  await delay(100);
  const assetId = c.req.param("assetId");
  const asset = getAssetById(assetId);
  if (asset) {
    const widgets = asset.widgets as Record<string, { widgetContents?: string }>;
    const fileObjectIds = (asset as { fileObjectIds?: string[] }).fileObjectIds;
    
    return c.json({
      objectId: asset.objectId,
      title: widgets.title_1?.widgetContents || "Untitled",
      description: widgets.description_2?.widgetContents || "",
      thumbnail: `/fileManager/getDerivativeById/${fileObjectIds?.[0]}/thumbnail`,
      collectionId: asset.collectionId,
      templateId: asset.templateId,
    });
  }
  // Fallback to default preview
  return c.json({ ...assetData.assetPreview, objectId: assetId });
});

// POST /asset/getEmbedAsJson/:fileId/:parentObjectId?
app.get("/getEmbedAsJson/:fileId/:parentObjectId?", async (c) => {
  await delay(150);
  return c.json(fileDownloads);
});

// GET /asset/viewExcerpt/:excerptId/true/true
app.get("/viewExcerpt/:excerptId/true/true", async (c) => {
  await delay(100);
  const excerptId = c.req.param("excerptId");
  return c.json({ ...excerpt, id: Number(excerptId) });
});

// GET /assetManager/getTemplate/:templateId
app.get("/getTemplate/:templateId", async (c) => {
  await delay(100);
  const templateId = c.req.param("templateId");
  return c.json({ ...template, templateId: Number(templateId) });
});

// POST /assetManager/submission/true (create/update asset)
app.post("/submission/true", async (c) => {
  await delay(500);
  const formData = await c.req.formData();
  const parsed = parseFormData(formData) as AssetFormData;
  
  // Simulate creation/update
  const objectId = parsed.objectId || `asset_${Date.now()}`;

  return c.json({
    objectId,
    success: true,
  });
});

// DELETE /assetManager/deleteAsset/:assetId/true
app.delete("/deleteAsset/:assetId/true", async (c) => {
  await delay(300);
  return c.json({ success: true, message: "Asset deleted successfully" });
});

// GET /assetManager/userAssets/:offset/:returnJson
app.get("/userAssets/:offset/:returnJson", async (c) => {
  await delay(200);
  return c.json(mockAssetSummaries);
});

// GET /assetManager/compareTemplates/:templateId/:newTemplateId
app.get("/compareTemplates/:templateId/:newTemplateId", async (c) => {
  await delay(100);
  return c.json({ migration: true });
});

// GET /assetManager/compareCollections/:collectionId/:newCollectionId
app.get("/compareCollections/:collectionId/:newCollectionId", async (c) => {
  await delay(100);
  return c.json({ migration: true });
});

// POST /assetManager/getFileContainer
app.post("/getFileContainer", async (c) => {
  await delay(200);
  return c.json({
    containers: [
      {
        index: 0,
        fileObjectId: `file_${Date.now()}`,
        success: true,
      },
    ],
  });
});

// GET /assetManager/completeSourceFile/:fileObjectId
app.get("/completeSourceFile/:fileObjectId", async (c) => {
  await delay(300);
  const fileObjectId = c.req.param("fileObjectId");
  return c.json({
    message: "Source file completed successfully",
    fileObjectId,
  });
});

export default app;
