import { Hono } from "hono";
import { parseFormData, delay, makeSimpleSVG } from "../utils/index";
import type { FileFormData, MockFile, MockServerContext } from "../types";
import {
  getOriginalFile,
  getThumbnail,
  getMimeType,
} from "../utils/fileProcessor";
import { promises as fs } from "fs";

const app = new Hono<MockServerContext>();

// How long a mock Glacier restore "takes" before the file flips back to
// downloadable. Real restores are hours; 60s is short enough to watch locally
// but long enough that the UI shows "Restoring…" across a poll tick or two
// before it resolves. The UI notices on its next poll.
const RESTORE_DURATION_MS = 60_000;

type ArchiveStatus = "downloadable" | "archived" | "restoring";

// Mirror of Filecontainers3::getArchiveStatus(): derive the pollable archive
// state from the raw S3 storage status. Hot classes (STANDARD, GLACIER_IR) and
// completed restores are downloadable; an in-flight thaw is restoring; cold
// Glacier (Flexible Retrieval) is archived.
function deriveArchiveStatus(s3: MockFile["s3StorageStatus"]): ArchiveStatus {
  if (
    !s3 ||
    s3.storageClass === "STANDARD" ||
    s3.storageClass === "GLACIER_IR"
  ) {
    return "downloadable";
  }
  if ("ongoingRequest" in s3) {
    return s3.ongoingRequest ? "restoring" : "downloadable";
  }
  return "archived";
}

// Shared by the legacy getOriginal route and the explicit `download` action.
// Returns null when the file's bytes aren't on disk so the caller can 404.
async function serveOriginal(fileId: string, filename?: string) {
  const { path, exists } = await getOriginalFile(fileId, filename);
  if (!exists) return null;

  const fileBuffer = await fs.readFile(path);
  const displayFilename = filename || `file-${fileId}`;
  return new Response(fileBuffer, {
    headers: {
      "Content-Type": getMimeType(displayFilename),
      "Content-Disposition": `attachment; filename="${displayFilename}"`,
    },
  });
}

// GET /fileManager/getMetadataForObject/:fileId
app.get("/getMetadataForObject/:fileId", async (c) => {
  await delay(150);
  const db = c.get("db");
  const fileId = c.req.param("fileId");
  const metadata = db.files.getMetadata(fileId);
  return c.json(metadata);
});

// GET /fileManager/getOriginal/:fileId  (legacy: no action segment = download)
app.get("/getOriginal/:fileId", async (c) => {
  await delay(300);
  const fileId = c.req.param("fileId");
  console.log(`Downloading original file: ${fileId}`);

  const db = c.get("db");
  const file = db.files.get(fileId);
  const res = await serveOriginal(fileId, file?.fileName);

  return res ?? c.json({ error: "File not found" }, 404);
});

// GET /fileManager/getOriginal/:fileId/status
// Idempotent archive-state check the UI polls. 200 + discriminated status, or
// 404 for an unknown file. (No per-original permission model in the mock, so
// the "forbidden" branch isn't exercised here.)
app.get("/getOriginal/:fileId/status", async (c) => {
  await delay(150);
  const db = c.get("db");
  const fileId = c.req.param("fileId");
  const file = db.files.get(fileId);

  if (!file) return c.json({ error: "unknownFile" }, 404);

  return c.json({ status: deriveArchiveStatus(file.s3StorageStatus) });
});

// GET /fileManager/getOriginal/:fileId/download
// Explicit download action used by the new frontend. The UI only navigates
// here once status is "downloadable", so it just serves the file.
app.get("/getOriginal/:fileId/download", async (c) => {
  await delay(300);
  const db = c.get("db");
  const fileId = c.req.param("fileId");
  const file = db.files.get(fileId);
  const res = await serveOriginal(fileId, file?.fileName);

  return res ?? c.json({ error: "originalNotAvailable" }, 404);
});

// POST /fileManager/getOriginal/:fileId/restore
// Queues a Glacier thaw: flip to "restoring" now, then to a completed restore
// after RESTORE_DURATION_MS so the poll can observe it become downloadable.
app.post("/getOriginal/:fileId/restore", async (c) => {
  await delay(150);
  const db = c.get("db");
  const fileId = c.req.param("fileId");
  const file = db.files.get(fileId);

  if (!file) return c.json({ error: "unknownFile" }, 404);

  db.files.set(fileId, {
    ...file,
    s3StorageStatus: { storageClass: "GLACIER", ongoingRequest: true },
  });

  setTimeout(() => {
    const current = db.files.get(fileId);
    if (!current) return;
    db.files.set(fileId, {
      ...current,
      s3StorageStatus: {
        storageClass: "GLACIER",
        ongoingRequest: false,
        expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      },
    });
    console.log(`Restore complete for ${fileId} — now downloadable`);
  }, RESTORE_DURATION_MS);

  console.log(`Queued restore for ${fileId}`);
  return c.json(
    {
      status: "restoring",
      message: "file is being restored, you will be notified when it's ready",
    },
    202
  );
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
