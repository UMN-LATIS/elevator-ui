import { Hono } from "hono";
import { parseFormData, delay, loadFixture } from "../utils/index";
import fileDownloads from "../fixtures/file-downloads";
import excerpt from "../fixtures/excerpt";
import template from "../fixtures/template";

const app = new Hono();
const assets = loadFixture("assets.json");

// GET /asset/viewAsset/:assetId/true
app.get("/viewAsset/:assetId/true", async (c) => {
  await delay(200);
  const assetId = c.req.param("assetId");
  return c.json({ ...assets.sampleAsset, assetId });
});

// GET /asset/getAssetPreview/:assetId
app.get("/getAssetPreview/:assetId", async (c) => {
  await delay(100);
  const assetId = c.req.param("assetId");
  return c.json({ ...assets.assetPreview, objectId: assetId });
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
  return c.json({ ...excerpt, excerptId: Number(excerptId) });
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
  const parsed = parseFormData(formData);

  // Simulate creation/update
  const objectId = parsed.formData?.objectId || `asset_${Date.now()}`;

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
  return c.json(assets.userAssets);
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
