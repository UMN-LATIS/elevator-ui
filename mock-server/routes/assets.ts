import { Hono } from "hono";
import { parseFormData, delay, stripMeta } from "../utils/index";
import { MockServerContext, type AssetFormData } from "../types";
import {
  Asset,
  PHPDateTime,
  RelatedAssetCache,
  RelatedAssetWidgetContent,
  Template,
  TextWidgetContent,
  UploadWidgetContent,
  WidgetContent,
} from "../../src/types";
import { saveableWidgetContents } from "../utils/widgetContentsKeptByServer";
import type { DB } from "../db/index";
import { isEmpty } from "ramda";

const app = new Hono<MockServerContext>();

// GET /asset/viewAsset/:assetId/true/:parentAssetId?
// parentAssetId grants access to auth-required assets when the parent is public
app.get("/viewAsset/:assetId/true/:parentAssetId?", async (c) => {
  await delay(200);
  const db = c.get("db");
  const assetId = c.req.param("assetId");
  const parentAssetId = c.req.param("parentAssetId");
  const asset = db.assets.get(assetId);
  if (!asset) {
    return c.json({ error: "Asset not found" }, 404);
  }

  if (asset._meta?.visibility === "authenticated" && !c.get("user")) {
    // Allow access if the parent asset is public
    const parentAsset = parentAssetId ? db.assets.get(parentAssetId) : null;
    const parentIsPublic = parentAsset?._meta?.visibility !== "authenticated";
    if (!parentAsset || !parentIsPublic) {
      return c.json({ error: "Unauthorized" }, 401);
    }
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

/**
 * Summarizes every asset this one links to, keyed by target asset id.
 *
 * The frontend renders a related asset only when it finds that asset's entry
 * here, so a target the db has no asset for is left out and reads as deleted.
 *
 * @returns [] when nothing is linked, the shape PHP gives an empty array.
 */
function buildRelatedAssetCache(
  db: DB,
  template: Template,
  widgetFields: Record<string, WidgetContent[]>
): RelatedAssetCache | never[] {
  const cache: RelatedAssetCache = {};

  for (const widgetDef of template.widgetArray) {
    // the literal rather than src's WIDGET_TYPES: importing a value out of
    // src/types drags its @/ aliases and a .vue import into the server
    if (widgetDef.type !== "related asset") continue;

    const contents = (widgetFields[widgetDef.fieldTitle] ??
      []) as RelatedAssetWidgetContent[];

    for (const { targetAssetId } of contents) {
      if (!targetAssetId) continue;
      const targetAsset = db.assets.get(targetAssetId);
      if (!targetAsset) continue;

      cache[targetAssetId] = {
        primaryHandler: targetAsset.firstFileHandlerId ?? null,
        readyForDisplay: !!targetAsset.readyForDisplay,
        relatedAssetTitle: targetAsset.title ?? [],
      };
    }
  }

  return isEmpty(cache) ? [] : cache;
}

/** The current time in PHP's DateTime serialization shape. */
function phpNow(): PHPDateTime {
  return {
    date: new Date().toISOString().replace("T", " ").replace("Z", "000"),
    timezone_type: 3,
    timezone: "UTC",
  };
}

/** How PHP serializes a DateTime parsed from the payload's date string. */
function toPhpDateTime(value: unknown): PHPDateTime | null {
  if (!value || typeof value !== "string") return null;
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return {
    date: isDateOnly ? `${value} 00:00:00.000000` : value,
    timezone_type: 3,
    timezone: "UTC",
  };
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

  const template = db.templates.get(formData.templateId);
  if (!template) {
    return c.json({ error: "template not found" }, 400);
  }

  // The real backend rebuilds the whole widget set from the payload, keyed by
  // the template, and its hasContents() drops rows it reads as empty. An
  // omitted, non-array, or all-empty field is absent from the document.
  const widgetFields: Record<string, WidgetContent[]> = {};
  for (const widgetDef of template.widgetArray) {
    const sentContents = formData[widgetDef.fieldTitle];
    if (!Array.isArray(sentContents)) continue;
    const keptContents = saveableWidgetContents(
      sentContents as WidgetContent[],
      widgetDef.type
    );
    if (keptContents.length > 0) {
      widgetFields[widgetDef.fieldTitle] = keptContents;
    }
  }

  const titleWidgets = widgetFields.title_1 as TextWidgetContent[] | undefined;
  const titleWidget = titleWidgets?.[0];

  // Find the first file from upload widgets to set as firstFileHandlerId
  const firstFileHandlerId = findFirstFileId(widgetFields);

  const existingAsset = formData.objectId
    ? db.assets.get(formData.objectId)
    : null;
  if (formData.objectId && !existingAsset) {
    return c.json({ error: "Asset not found" }, 404);
  }

  // global values are rebuilt from the payload too: an absent key is null
  const storedAsset = {
    assetId: formData.objectId || "",
    templateId: formData.templateId,
    collectionId: formData.collectionId,
    readyForDisplay: !!formData.readyForDisplay,
    availableAfter: toPhpDateTime(formData.availableAfter),
    title: [titleWidget?.fieldContents || "(Untitled)"],
    titleObject: existingAsset?.titleObject ?? null,
    // the real backend recomputes this on every save, so a cache entry for a
    // target the payload no longer links to goes away rather than lingering
    relatedAssetCache: buildRelatedAssetCache(db, template, widgetFields),
    firstFileHandlerId,
    firstObjectId: existingAsset?.firstObjectId ?? null,
    modified: phpNow(),
    modifiedBy: user.id,
    // every save force-undeletes, like Asset_model::save
    deleted: false,
    deletedAt: null,
    deletedBy: null,
    ...widgetFields,
  };

  let savedAsset: Asset;
  if (existingAsset) {
    // full-document replace, not a merge: fields the payload omitted are
    // gone, exactly as on the real backend
    savedAsset = {
      ...storedAsset,
      assetId: existingAsset.assetId,
      createdBy: existingAsset.createdBy,
      _meta: existingAsset._meta,
    } as Asset;
    db.assets.set(existingAsset.assetId, savedAsset);
  } else {
    savedAsset = db.assets.create({
      ...storedAsset,
      createdBy: user.id,
    } as Asset);
  }

  // Update all files referenced in this asset to link back to the asset
  updateFileAssetLinks(db, widgetFields, savedAsset.assetId);

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
    original: {
      originalFilename: filename,
      path: "original",
    },
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

// GET /asset/getEmbed/:fileId/:parentObjectId?/:embed?
// The ObjectViewer iframe loads this. The mock can't render real files, so
// return a placeholder instead of falling through to the SPA catch-all.
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

export default app;
