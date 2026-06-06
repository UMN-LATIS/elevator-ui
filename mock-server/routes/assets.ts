import { Hono } from "hono";
import { parseFormData, delay, stripMeta } from "../utils/index";
import { MockServerContext, type AssetFormData } from "../types";
import { Asset, TextWidgetContent, UploadWidgetContent } from "../../src/types";
import type { DB } from "../db/index";
import { isEmpty } from "ramda";

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

  if (asset._meta?.visibility === "authenticated" && !c.get("user")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (asset.deleted === true) {
    return c.json(
      {
        error: "deleted",
        objectId: assetId,
        deletedAt: asset.deletedAt ?? null,
        deletedBy: asset.deletedBy ?? null,
      },
      410,
      { "Cache-Control": "no-store" }
    );
  }
  return c.json(stripMeta(asset));
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

// GET /asset/getEmbedAsJson/:fileId/:parentObjectId?
// Download options for a file. Our mock file is a text doc with no derivatives,
// so just the original (originalFilename + path, as in prod).
app.get("/getEmbedAsJson/:fileId/:parentObjectId?", async (c) => {
  await delay(150);
  const db = c.get("db");
  const fileId = c.req.param("fileId");
  const file = db.files.get(fileId);
  const originalFilename = file?.fileName ?? `file-${fileId}`;

  return c.json({
    original: {
      originalFilename,
      path: "original",
    },
  });
});

// GET /asset/getEmbed/:fileId/:parentObjectId?/:embed?
// The ObjectViewer iframe loads this. The mock can't render files, so it
// returns a placeholder instead of 404ing.
app.get("/getEmbed/:fileId/:parentObjectId?/:embed?", async (c) => {
  await delay(100);
  const db = c.get("db");
  const fileId = c.req.param("fileId");
  const file = db.files.get(fileId);
  const filename = file?.fileName ?? `file-${fileId}`;

  return c.html(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Object viewer</title>
    <style>
      body { margin: 0; display: grid; place-items: center; min-height: 100vh;
        background: #1b1b1f; color: #9aa0a6; font-family: system-ui, sans-serif;
        text-align: center; }
      small { opacity: 0.7; }
    </style>
  </head>
  <body>
    <p>Object viewer not implemented in the mock server.<br /><small>${filename}</small></p>
  </body>
</html>`);
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

function findFirstFileId(
  formData: Record<string, unknown>
): string | undefined {
  return Object.entries(formData)
    .filter(
      ([key, value]) =>
        key.startsWith("upload_") && Array.isArray(value) && value.length > 0
    )
    .map(([, widgets]) => (widgets as UploadWidgetContent[])[0])
    .find((widget) => widget?.fileId)?.fileId;
}

function updateFileAssetLinks(
  db: DB,
  formData: Record<string, unknown>,
  assetId: string
): void {
  const fileIds = Object.entries(formData)
    .filter(([key, value]) => key.startsWith("upload_") && Array.isArray(value))
    .flatMap(([, widgets]) => widgets as UploadWidgetContent[])
    .map((widget) => widget.fileId)
    .filter(Boolean);

  fileIds.forEach((fileId) => {
    const existingFile = db.files.get(fileId);
    if (existingFile) {
      db.files.set(fileId, {
        ...existingFile,
        assetId,
      });
    }
  });
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

// GET /assetManager/userAssets/:userId/true
app.get("/userAssets/:userId/true", async (c) => {
  await delay(100);
  const db = c.get("db");
  const user = c.get("user");
  const userId = c.req.param("userId");

  // For security, only allow users to see their own assets (or admin users could see all)
  if (
    user &&
    (user.id.toString() === userId || user.isSuperAdmin || user.isInstanceAdmin)
  ) {
    const userAssets = db.assets.getByUserId(Number(userId));
    return c.json(userAssets);
  }

  return c.json({ error: "Unauthorized" }, 403);
});

// GET /assetManager/compareTemplates/:templateId1/:templateId2
app.get("/compareTemplates/:templateId1/:templateId2", async (c) => {
  await delay(100);

  const db = c.get("db");

  const templateId1 = Number(c.req.param("templateId1"));
  const templateId2 = Number(c.req.param("templateId2"));
  const template1 = db.templates.get(templateId1);
  const template2 = db.templates.get(templateId2);
  if (!template1 || !template2) {
    return c.json({ error: "One or both templates not found" }, 404);
  }
  const differences = db.templates.compare(template1, template2);

  // prod returns empty array if no differences
  return isEmpty(differences) ? c.json([]) : c.json(differences);
});

export default app;
