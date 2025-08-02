import sharp from "sharp";
import { promises as fs } from "fs";
import { join, extname } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import mime from "mime-types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FILES_DIR = join(__dirname, "../files");
const ORIGINALS_DIR = join(FILES_DIR, "originals");
const THUMBNAILS_DIR = join(FILES_DIR, "thumbnails");
const PREVIEWS_DIR = join(FILES_DIR, "previews");

export interface ProcessedFile {
  fileObjectId: string;
  originalPath: string;
  filename: string;
  mimeType: string;
  size: number;
  isImage: boolean;
  dimensions?: { width: number; height: number };
}

export async function processUploadedFile(
  tempFilePath: string,
  fileObjectId: string,
  originalFilename: string
): Promise<ProcessedFile> {
  // Ensure directories exist
  await fs.mkdir(ORIGINALS_DIR, { recursive: true });
  await fs.mkdir(THUMBNAILS_DIR, { recursive: true });
  await fs.mkdir(PREVIEWS_DIR, { recursive: true });

  // Move file to permanent storage
  const extension = extname(originalFilename) || "";
  const permanentPath = join(ORIGINALS_DIR, `${fileObjectId}${extension}`);
  await fs.rename(tempFilePath, permanentPath);

  // Get file stats
  const stats = await fs.stat(permanentPath);
  const mimeType = mime.lookup(originalFilename) || "application/octet-stream";
  const isImage = mimeType.startsWith("image/");

  const processedFile: ProcessedFile = {
    fileObjectId,
    originalPath: permanentPath,
    filename: originalFilename,
    mimeType,
    size: stats.size,
    isImage,
  };

  // Generate thumbnails for images
  if (isImage && canProcessImage(mimeType)) {
    try {
      const image = sharp(permanentPath);
      const metadata = await image.metadata();

      processedFile.dimensions = {
        width: metadata.width || 0,
        height: metadata.height || 0,
      };

      // Generate tiny thumbnail (64px)
      const tinyPath = join(THUMBNAILS_DIR, `${fileObjectId}_tiny.jpg`);
      await image
        .resize(64, 64, { fit: "cover", position: "center" })
        .jpeg({ quality: 80 })
        .toFile(tinyPath);

      // Generate preview thumbnail (300px)
      const previewPath = join(PREVIEWS_DIR, `${fileObjectId}_preview.jpg`);
      await image
        .resize(300, 300, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(previewPath);
    } catch (error) {
      console.error(`Error processing image ${fileObjectId}:`, error);
    }
  }

  return processedFile;
}

export async function getOriginalFile(
  fileObjectId: string,
  filename?: string
): Promise<{ path: string; exists: boolean }> {
  // If we have the filename, use its extension
  if (filename) {
    const extension = extname(filename);
    const filePath = join(ORIGINALS_DIR, `${fileObjectId}${extension}`);
    try {
      await fs.access(filePath);
      return { path: filePath, exists: true };
    } catch {
      // File doesn't exist
    }
  }

  // Fallback: try to find any file with this fileObjectId
  // This handles cases where we don't have the filename in the database
  try {
    const files = await fs.readdir(ORIGINALS_DIR);
    const matchingFile = files.find((file) => file.startsWith(fileObjectId));

    if (matchingFile) {
      const filePath = join(ORIGINALS_DIR, matchingFile);
      return { path: filePath, exists: true };
    }
  } catch {
    // Directory doesn't exist or other error
  }

  return { path: "", exists: false };
}

export async function getThumbnail(
  fileObjectId: string,
  size: "tiny" | "preview"
): Promise<{ path: string; exists: boolean }> {
  const dir = size === "tiny" ? THUMBNAILS_DIR : PREVIEWS_DIR;
  const filename = `${fileObjectId}_${size}.jpg`;
  const filePath = join(dir, filename);

  try {
    await fs.access(filePath);
    return { path: filePath, exists: true };
  } catch {
    return { path: "", exists: false };
  }
}

function canProcessImage(mimeType: string): boolean {
  const supportedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/tiff",
    "image/bmp",
  ];
  return supportedTypes.includes(mimeType);
}

export function getFileExtension(filename: string): string {
  return extname(filename).toLowerCase();
}

export function getMimeType(filename: string): string {
  return mime.lookup(filename) || "application/octet-stream";
}
