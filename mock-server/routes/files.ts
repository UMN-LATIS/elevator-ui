import { Hono } from "hono";
import { parseFormData, delay } from "../utils/index";
import { db } from "../db/index.js";
import type { FileFormData, MockServerContext } from "../types";

const app = new Hono<MockServerContext>();

// GET /fileManager/getMetadataForObject/:fileId
app.get("/getMetadataForObject/:fileId", async (c) => {
  await delay(150);
  const fileId = c.req.param("fileId");
  const metadata = db.files.getMetadata(fileId);
  return c.json(metadata);
});

// GET /fileManager/getOriginal/:fileId
app.get("/getOriginal/:fileId", async (c) => {
  // Simulate file download - return a simple text response
  const fileId = c.req.param("fileId");
  console.log(`Downloading original file: ${fileId}`);

  return new Response(`Mock file content for ${fileId}`, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="file-${fileId}.pdf"`,
    },
  });
});

// GET /fileManager/getDerivativeById/:fileId/:filetype
app.get("/getDerivativeById/:fileId/:filetype", async (c) => {
  const fileId = c.req.param("fileId");
  const filetype = c.req.param("filetype");

  console.log(`Downloading derivative: ${fileId} (${filetype})`);

  if (filetype === "thumbnail") {
    // Return a simple SVG placeholder for thumbnails
    const svg = `
      <svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
        <rect width="150" height="150" fill="#f0f0f0" stroke="#ccc"/>
        <text x="75" y="75" text-anchor="middle" fill="#666" font-size="12">
          Thumbnail ${fileId}
        </text>
      </svg>
    `;
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

  // Mock all files as having previews available
  const results = (fileIds as string[]).map((fileId: string) => ({
    fileId,
    status: Math.random() > 0.3 ? "true" : "icon",
  }));

  return c.json(results);
});

// POST /fileManager/deleteFileObject
app.post("/deleteFileObject", async (c) => {
  await delay(300);
  const formData = await c.req.formData();
  const fileObjectId = formData.get("fileObjectId") as string;

  console.log(`Deleting file object: ${fileObjectId}`);

  return c.json({
    message: "File object deleted successfully",
  });
});

// S3 Upload endpoints
// POST /s3/multipart
app.post("/multipart", async (c) => {
  await delay(200);
  const formData = await c.req.formData();
  const fileObjectId = formData.get("fileObjectId") as string;

  const uploadId = `upload_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  return c.json({
    message: "Multipart upload initiated",
    uploadId,
    key: `uploads/${fileObjectId}`,
  });
});

// POST /s3/multipart/:uploadId/:partNumber
app.post("/multipart/:uploadId/:partNumber", async (c) => {
  await delay(100);
  const uploadId = c.req.param("uploadId");
  const partNumber = Number(c.req.param("partNumber"));

  return c.json({
    message: "Part upload URL generated",
    url: `https://mock-s3.amazonaws.com/upload-part?uploadId=${uploadId}&partNumber=${partNumber}`,
    method: "PUT",
    partNumber,
    uploadId,
  });
});

// POST /s3/multipart/:uploadId/complete
app.post("/multipart/:uploadId/complete", async (c) => {
  await delay(300);
  const uploadId = c.req.param("uploadId");

  return c.json({
    location: `https://mock-s3.amazonaws.com/completed-file-${uploadId}`,
    message: "Multipart upload completed successfully",
  });
});

// POST /s3/multipart/:uploadId/abort
app.post("/multipart/:uploadId/abort", async (c) => {
  await delay(200);
  const uploadId = c.req.param("uploadId");

  console.log(`Aborting upload: ${uploadId}`);

  return c.json({
    message: "Multipart upload aborted successfully",
  });
});

export default app;
