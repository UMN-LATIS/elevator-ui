import { createBaseTable } from "./baseTable";

export interface UploadRecord {
  uploadId: string;
  fileObjectId: string;
  collectionId: number;
  contentType: string;
  key: string;
  status: "started" | "completed" | "aborted";
  parts: UploadPart[];
  createdAt: string;
  completedAt?: string;
}

export interface UploadPart {
  partNumber: number;
  etag?: string;
  size?: number;
  filePath?: string; // path to part file in tmp/
}

const seedData: UploadRecord[] = [];

export function createUploadsTable() {
  const baseTable = createBaseTable<UploadRecord, string>(
    (upload) => upload.uploadId,
    seedData
  );

  return {
    ...baseTable,

    create: (
      fileObjectId: string,
      collectionId: number,
      contentType: string
    ): UploadRecord => {
      const uploadId = generateUploadId();
      const key = buildS3Key(fileObjectId);

      const upload: UploadRecord = {
        uploadId,
        fileObjectId,
        collectionId,
        contentType,
        key,
        status: "started",
        parts: [],
        createdAt: new Date().toISOString(),
      };

      baseTable.set(uploadId, upload);
      return upload;
    },

    addPart: (uploadId: string, partNumber: number, filePath: string): void => {
      const upload = baseTable.get(uploadId);
      if (!upload) return;

      const existingPart = upload.parts.find(
        (p) => p.partNumber === partNumber
      );
      if (existingPart) {
        existingPart.filePath = filePath;
      } else {
        upload.parts.push({
          partNumber,
          filePath,
          etag: generateETag(),
        });
      }

      // Sort parts by part number
      upload.parts.sort((a, b) => a.partNumber - b.partNumber);
      baseTable.set(uploadId, upload);
    },

    complete: (uploadId: string): UploadRecord | undefined => {
      const upload = baseTable.get(uploadId);
      if (!upload) return undefined;

      upload.status = "completed";
      upload.completedAt = new Date().toISOString();
      baseTable.set(uploadId, upload);
      return upload;
    },

    abort: (uploadId: string): void => {
      const upload = baseTable.get(uploadId);
      if (!upload) return;

      upload.status = "aborted";
      baseTable.set(uploadId, upload);
    },
  };
}

function generateUploadId(): string {
  return `upload_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
}

function generateETag(): string {
  return `"${Math.random().toString(36).substring(2, 34)}"`;
}

function buildS3Key(fileObjectId: string): string {
  const reversedId = fileObjectId.split("").reverse().join("");
  return `original/${reversedId}-source`;
}

export type UploadsTable = ReturnType<typeof createUploadsTable>;
