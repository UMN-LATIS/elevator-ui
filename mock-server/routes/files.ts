import { Hono } from "hono";
import { parseFormData, delay, makeSimpleSVG } from "../utils/index";
import type { FileFormData, MockServerContext } from "../types";
import {
  getOriginalFile,
  getThumbnail,
  getMimeType,
} from "../utils/fileProcessor";
import { promises as fs } from "fs";

const app = new Hono<MockServerContext>();

// The legacy backend renders this page when an original is archived in Glacier.
// The mock returns it from getOriginal to reproduce #546.
const GLACIER_RESTORING_HTML = `<div class="jumbotron">
  <div class="container">
    <h1>Give us a moment</h1>
    <p>It's going to take some time to get that file ready for you.  We'll send you an email when it's all set.</p>
  </div>
</div>`;

// GET /fileManager/getMetadataForObject/:fileId
app.get("/getMetadataForObject/:fileId", async (c) => {
  await delay(150);
  const db = c.get("db");
  const fileId = c.req.param("fileId");
  const metadata = db.files.getMetadata(fileId);
  return c.json(metadata);
});

// GET /fileManager/getOriginal/:fileId
app.get("/getOriginal/:fileId", async (c) => {
  await delay(300);
  const fileId = c.req.param("fileId");
  console.log(`Downloading original file: ${fileId}`);

  const db = c.get("db");
  const file = db.files.get(fileId);
  const filename = file?.fileName;

  // Archived originals come back as the restore page (200, text/html), not the
  // file bytes — this is the #546 bug.
  if (file?.storageClass === "GLACIER") {
    return c.html(GLACIER_RESTORING_HTML);
  }

  const displayFilename = filename || `file-${fileId}`;
  const { path, exists } = await getOriginalFile(fileId, filename);

  // Seeded files have no bytes on disk. Return a small valid file so a
  // non-Glacier original still downloads cleanly (instead of 404ing).
  if (!exists) {
    return new Response(`Mock original file: ${displayFilename}\n`, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${displayFilename}"`,
      },
    });
  }

  const fileBuffer = await fs.readFile(path);
  const mimeType = getMimeType(displayFilename);

  return new Response(fileBuffer, {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${displayFilename}"`,
    },
  });
});

// GET /fileManager/getDerivativeById/:fileId/:filetype
app.get("/getDerivativeById/:fileId/:filetype", async (c) => {
  await delay(200);
  const fileId = c.req.param("fileId");
  const filetype = c.req.param("filetype");

  console.log(`Downloading derivative: ${fileId} (${filetype})`);

  if (filetype === "thumbnail") {
    // Try to serve real thumbnail first
    const { path, exists } = await getThumbnail(fileId, "preview");

    if (exists) {
      const fileBuffer = await fs.readFile(path);
      return new Response(fileBuffer, {
        headers: { "Content-Type": "image/jpeg" },
      });
    }

    // Fallback to SVG placeholder
    const svg = makeSimpleSVG(fileId);
    return new Response(svg, {
      headers: { "Content-Type": "image/svg+xml" },
    });
  }

  return new Response(`Mock ${filetype} content for ${fileId}`, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="file-${fileId}.${filetype}"`,
    },
  });
});

// POST /fileManager/previewImageAvailable
app.post("/previewImageAvailable", async (c) => {
  await delay(100);
  const formData = await c.req.formData();
  const parsed = parseFormData(formData) as FileFormData;
  const fileIds = parsed.checkArray || [];

  const results = (fileIds as string[]).map((fileId: string) => ({
    fileId,
    status: Math.random() < 0.6 ? "icon" : "true",
  }));

  return c.json(results);
});

// GET /fileManager/tinyImageByFileId/:fileId/true
app.get("/tinyImageByFileId/:fileId/true", async (c) => {
  await delay(100);
  const fileId = c.req.param("fileId");

  // Try to serve real tiny thumbnail first
  const { path, exists } = await getThumbnail(fileId, "tiny");

  if (exists) {
    const fileBuffer = await fs.readFile(path);
    return new Response(fileBuffer, {
      headers: { "Content-Type": "image/jpeg" },
    });
  }

  // Fallback to SVG placeholder
  const svg = makeSimpleSVG(fileId);
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml" },
  });
});

// GET /fileManager/previewImageByFileId/:fileId/true
app.get("/previewImageByFileId/:fileId/true", async (c) => {
  await delay(100);
  const fileId = c.req.param("fileId");

  // Try to serve real preview thumbnail first
  const { path, exists } = await getThumbnail(fileId, "preview");

  if (exists) {
    const fileBuffer = await fs.readFile(path);
    return new Response(fileBuffer, {
      headers: { "Content-Type": "image/jpeg" },
    });
  }

  // Fallback to SVG placeholder
  const svg = makeSimpleSVG(fileId);
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml" },
  });
});

// POST /fileManager/deleteFileObject
app.post("/deleteFileObject", async (c) => {
  await delay(100);
  const formData = await c.req.formData();
  const parsed = parseFormData(formData) as FileFormData;
  const fileObjectId = parsed.fileObjectId as string;

  if (!fileObjectId) {
    return c.json({ error: "fileObjectId is required" }, 400);
  }

  const db = c.get("db");
  const deleted = db.files.delete(fileObjectId);

  if (!deleted) {
    return c.json({ error: "File not found" }, 404);
  }

  console.log(`Deleted file: ${fileObjectId}`);
  return c.json({ success: true, fileObjectId });
});

export default app;
