import { Hono } from "hono";
import { promises as fs } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import type { MockServerContext } from "../types";
import { processUploadedFile } from "../utils/fileProcessor";
import { delay } from "../utils";

const app = new Hono<MockServerContext>();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TMP_DIR = join(__dirname, "../tmp");

// Debug middleware to log all requests
app.use("*", async (c, next) => {
  console.log(`S3 Route: ${c.req.method} ${c.req.path}`);
  await next();
});

function getFileTypeFromMime(mimeType: string): string {
  const typeMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "application/pdf": "pdf",
    "text/plain": "txt",
  };
  return typeMap[mimeType] || "unknown";
}

async function concatenateUploadParts(upload: any): Promise<string> {
  const finalFileName = `${upload.fileObjectId}-final`;
  const finalFilePath = join(TMP_DIR, finalFileName);

  // Create write stream for final file
  const writeStream = await fs.open(finalFilePath, "w");

  // Concatenate all parts in order
  for (const part of upload.parts) {
    if (part.filePath) {
      const partData = await fs.readFile(part.filePath);
      await writeStream.write(partData);

      // Clean up part file
      await fs.unlink(part.filePath).catch(() => {
        // Ignore errors if file doesn't exist
      });
    }
  }

  await writeStream.close();
  return finalFilePath;
}

async function handleFileProcessing(
  db: any,
  upload: any,
  finalFilePath: string
): Promise<void> {
  try {
    // For now, use a generic filename - in real app this would come from the original request
    const originalFilename = `upload-${upload.fileObjectId}.jpg`;
    const processedFile = await processUploadedFile(
      finalFilePath,
      upload.fileObjectId,
      originalFilename
    );

    console.log("File processed successfully:", processedFile);

    // Store file metadata in the database
    db.files.set(upload.fileObjectId, {
      id: upload.fileObjectId,
      fileName: processedFile.filename,
      fileType: getFileTypeFromMime(processedFile.mimeType),
      fileSize: processedFile.size,
      metadata: processedFile.dimensions || {},
      assetId: "", // Will be linked when asset is created
      uploadedAt: new Date(),
    });
  } catch (error) {
    console.error("Error processing uploaded file:", error);
    // Continue anyway - the upload succeeded even if processing failed
  }
}

// POST /s3/multipart - Start multipart upload
app.post("/multipart", async (c) => {
  await delay(200);
  const db = c.get("db");
  const formData = await c.req.formData();

  const collectionId = parseInt(formData.get("collectionId") as string);
  const fileObjectId = formData.get("fileObjectId") as string;
  const contentType = formData.get("contentType") as string;

  if (!collectionId || !fileObjectId || !contentType) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  const upload = db.uploads.create(fileObjectId, collectionId, contentType);

  return c.json({
    message: "Multipart upload started successfully",
    uploadId: upload.uploadId,
    key: upload.key,
  });
});

// POST /s3/multipart/{uploadId}/complete - Complete multipart upload
app.post("/multipart/*/complete", async (c) => {
  await delay(500);
  const pathParts = c.req.path.split("/");
  const uploadId = pathParts[pathParts.length - 2];
  console.log("Complete upload endpoint hit");
  console.log("Upload ID:", uploadId);
  const db = c.get("db");

  const upload = db.uploads.get(uploadId);
  console.log("Found upload:", upload);
  if (!upload) {
    console.log("Upload not found for ID:", uploadId);
    return c.json({ error: "Upload not found" }, 404);
  }

  try {
    // Combine all parts into final file
    const finalFilePath = await concatenateUploadParts(upload);

    // Process the completed file (move to permanent storage, generate thumbnails)
    await handleFileProcessing(db, upload, finalFilePath);

    // Mark upload as completed
    db.uploads.complete(uploadId);

    // Return mock S3 location
    const mockLocation = `https://mock-s3.local/${upload.key}`;

    return c.json({
      message: "completeMultipartUpload",
      location: mockLocation,
    });
  } catch (error) {
    console.error("Error completing upload:", error);
    return c.json({ error: "Failed to complete upload" }, 500);
  }
});

// POST /s3/multipart/{uploadId}/abort - Abort multipart upload
app.post("/multipart/*/abort", async (c) => {
  await delay(500);
  const pathParts = c.req.path.split("/");
  const uploadId = pathParts[pathParts.length - 2];
  console.log("Abort upload endpoint hit");
  console.log("Abort Upload ID:", uploadId);
  const db = c.get("db");

  const upload = db.uploads.get(uploadId);
  console.log("Found upload for abort:", upload);
  if (!upload) {
    console.log("Upload not found for abort ID:", uploadId);
    return c.json({ error: "Upload not found" }, 404);
  }

  try {
    // Clean up part files
    for (const part of upload.parts) {
      if (part.filePath) {
        await fs.unlink(part.filePath).catch(() => {
          // Ignore errors if file doesn't exist
        });
      }
    }

    // Mark upload as aborted
    db.uploads.abort(uploadId);

    return c.json({ message: "Multipart upload aborted successfully" });
  } catch (error) {
    console.error("Error aborting upload:", error);
    return c.json({ error: "Failed to abort upload" }, 500);
  }
});

// POST /s3/multipart/{uploadId}/{partNumber} - Sign part upload
app.post("/multipart/:uploadId/:partNumber", async (c) => {
  await delay(200);
  const db = c.get("db");
  const { uploadId, partNumber } = c.req.param();
  const partNum = parseInt(partNumber);

  if (!uploadId || isNaN(partNum) || partNum < 1 || partNum > 10000) {
    return c.json({ error: "Invalid uploadId or partNumber" }, 400);
  }

  const upload = db.uploads.get(uploadId);
  if (!upload) {
    return c.json({ error: "Upload not found" }, 404);
  }

  // Create a mock signed URL that points to our own endpoint
  const mockSignedUrl = `http://localhost:3001/s3/upload-part/${uploadId}/${partNumber}`;

  return c.json({
    message: "signPart",
    url: mockSignedUrl,
    method: "PUT",
    partNumber: partNum,
    uploadId,
  });
});

// PUT /s3/upload-part/{uploadId}/{partNumber} - Handle actual part upload
app.put("/upload-part/:uploadId/:partNumber", async (c) => {
  const db = c.get("db");
  const { uploadId, partNumber } = c.req.param();
  const partNum = parseInt(partNumber);

  const upload = db.uploads.get(uploadId);
  if (!upload) {
    return c.json({ error: "Upload not found" }, 404);
  }

  try {
    // Get the uploaded file data
    const buffer = await c.req.arrayBuffer();
    const partFileName = `${uploadId}-part-${partNumber}`;
    const partFilePath = join(TMP_DIR, partFileName);

    // Ensure tmp directory exists
    await fs.mkdir(TMP_DIR, { recursive: true });

    // Write part to file
    await fs.writeFile(partFilePath, new Uint8Array(buffer));

    // Generate ETag (required by S3 protocol)
    const etag = `"${Math.random().toString(36).substring(2, 34)}"`;

    // Add part to upload record with ETag
    const part = db.uploads.addPart(uploadId, partNum, partFilePath, etag);

    return new Response(null, {
      status: 200,
      headers: {
        ETag: part.etag || etag,
      },
    });
  } catch (error) {
    console.error("Error handling part upload:", error);
    return c.json({ error: "Failed to save part" }, 500);
  }
});

export default app;
