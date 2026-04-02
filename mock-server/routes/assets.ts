import { Hono } from "hono";
import { parseFormData, delay } from "../utils/index";
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
  return c.json(asset);
});

// DELETE /assetManager/deleteAsset/:assetId/true
app.delete("/deleteAsset/:assetId/true", async (c) => {
  // simulate longer delete time for testing optimistic ui behavior
  await delay(2000);

  const db = c.get("db");
  const user = c.get("user");
  const assetId = c.req.param("assetId");

  const asset = db.assets.get(assetId);
  if (!asset) {
    return c.json({ error: "Asset not found" }, 404);
  }

  // Soft delete: mark as deleted but keep the record (mirrors PHP backend behaviour)
  db.assets.set(assetId, {
    ...asset,
    deleted: true,
    deletedAt: new Date().toISOString(),
    deletedBy: user?.id ?? null,
  });

  return c.body(null, 204);
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

// GET /assetManager/userAssets/:offset/true
// The real backend uses the session user, not a URL param.
// The first segment is an offset for pagination (unused in mock).
app.get("/userAssets/:offset/true", async (c) => {
  await delay(100);
  const db = c.get("db");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const userAssets = db.assets.getByUserId(user.id);
  return c.json(userAssets);
});

// GET /assetManager/deletedAssets
app.get("/deletedAssets", async (c) => {
  await delay(100);
  const db = c.get("db");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const deletedAssets = db.assets.getDeletedByUser(user.id);
  return c.json(deletedAssets);
});

// POST /assetManager/undeleteAsset/:assetId
app.post("/undeleteAsset/:assetId", async (c) => {
  // simulate longer time for testing optimistic ui behavior
  await delay(2000);
  const db = c.get("db");
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const assetId = c.req.param("assetId");
  const asset = db.assets.get(assetId);
  if (!asset || !asset.deleted) {
    return c.json({ error: "Asset not found" }, 404);
  }

  db.assets.set(assetId, {
    ...asset,
    deleted: false,
    deletedAt: null,
    deletedBy: null,
  });

  return c.json({ objectId: assetId });
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

// GET /asset/getEmbedAsJson/:fileId/:parentObjectId?
// Returns download info for a file's derivatives in the shape the frontend expects.
app.get("/getEmbedAsJson/:fileId/:parentObjectId?", async (c) => {
  await delay(100);
  const db = c.get("db");
  const fileId = c.req.param("fileId");
  const file = db.files.get(fileId);
  const filename = file?.fileName ?? `file-${fileId}`;

  const makeEntry = (
    filetype: string,
    {
      ready = true,
      downloadable = true,
    }: { ready?: boolean; downloadable?: boolean } = {}
  ) => ({
    storageClass: "local",
    originalFilename: filename,
    path: `/files/${fileId}/${filetype}`,
    derivativeType: filetype,
    metadata: [],
    basePath: "/files",
    baseWebPath: "/files",
    ready,
    forcedMimeType: null,
    localAsset: null,
    storageKey: `${fileId}_${filetype}`,
    downloadable,
  });

  const fileType = file?.fileType ?? "unknown";
  const isNonDownloadable = ["dcm", "dicom"].includes(fileType);

  return c.json({
    original: makeEntry("original", { ready: true, downloadable: true }),
    thumbnail: makeEntry("thumbnail", {
      ready: true,
      downloadable: !isNonDownloadable,
    }),
    screen: makeEntry("screen", {
      ready: true,
      downloadable: !isNonDownloadable,
    }),
  });
});

export default app;
