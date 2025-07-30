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

// POST /assetManager/getFileContainer
app.post("/getFileContainer", async (c) => {
  await delay(100);
  const formData = await c.req.formData();
  const containersJson = formData.get("containers") as string;

  if (!containersJson) {
    return c.json({ error: "Missing containers field" }, 400);
  }

  try {
    const containers = JSON.parse(containersJson);
    const result = containers.map((container: any) => ({
      bucket: "mock-elevator-bucket",
      bucketKey: "MOCK_BUCKET_KEY",
      fileObjectId: generateFileObjectId(),
      collectionId: container.collectionId,
      index: container.index,
      filename: container.filename,
    }));

    return c.json(result);
  } catch (error) {
    return c.json({ error: "Invalid containers JSON" }, 400);
  }
});

// GET /assetManager/completeSourceFile/:fileObjectId
app.get("/completeSourceFile/:fileObjectId", async (c) => {
  await delay(100);
  const fileObjectId = c.req.param("fileObjectId");

  return c.json({
    message: "Source file completed successfully",
    fileObjectId,
  });
});

function generateFileObjectId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

function findFirstFileId(formData: any): string | undefined {
  // Look through all form data for upload widgets
  for (const [key, value] of Object.entries(formData)) {
    if (key.startsWith("upload_") && Array.isArray(value) && value.length > 0) {
      const uploadWidget = value[0] as any;
      if (uploadWidget.fileId) {
        return uploadWidget.fileId;
      }
    }
  }
  return undefined;
}

function updateFileAssetLinks(db: any, formData: any, assetId: string): void {
  // Find all upload widgets and update their files to link back to this asset
  for (const [key, value] of Object.entries(formData)) {
    if (key.startsWith("upload_") && Array.isArray(value)) {
      for (const uploadWidget of value as any[]) {
        if (uploadWidget.fileId) {
          const existingFile = db.files.get(uploadWidget.fileId);
          if (existingFile) {
            // Update the file to link back to this asset
            db.files.set(uploadWidget.fileId, {
              ...existingFile,
              assetId: assetId,
            });
          }
        }
      }
    }
  }
}

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

  if (!formData.templateId || !formData.collectionId) {
    return c.json({ error: "Template and collection are required" }, 400);
  }

  const titleWidgets = formData.title_1 as TextWidgetContent[];
  const titleWidget = titleWidgets?.[0];

  // Find the first file from upload widgets to set as firstFileHandlerId
  const firstFileHandlerId = findFirstFileId(formData);

  const asset: Omit<Asset, "createdBy"> = {
    ...formData,
    assetId: formData.objectId,
    title: [titleWidget?.fieldContents || "(Untitled)"],
    templateId: formData.templateId,
    collectionId: formData.collectionId,
    firstFileHandlerId,
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

  // Update all files referenced in this asset to link back to the asset
  updateFileAssetLinks(db, formData, savedAsset.assetId);

  if (firstFileHandlerId) {
    console.log(
      `Asset ${savedAsset.assetId} linked to first file: ${firstFileHandlerId}`
    );
  }

  return c.json({
    success: true,
    objectId: savedAsset.assetId,
  });
});

export default app;
