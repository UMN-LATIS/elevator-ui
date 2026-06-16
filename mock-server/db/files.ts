import { MockFile } from "../types";
import { createBaseTable } from "./baseTable";

const fileSeeds: MockFile[] = [
  {
    id: "6875872f4eb080a4880a0f45",
    fileName: "1F3DF.svg",
    fileType: "svg",
    fileSize: 2048,
    metadata: { width: 256, height: 256 },
    uploadedAt: new Date(),
    assetId: "6875871d4eb080a4880a0f44",
  },
  {
    id: "687587494eb080a4880a0f46",
    fileName: "1F37B.svg",
    fileType: "svg",
    fileSize: 1536,
    metadata: { width: 256, height: 256 },
    uploadedAt: new Date(),
    assetId: "6875871d4eb080a4880a0f44",
  },
  {
    id: "goldy-face_001",
    fileName: "goldy-face_001.png",
    fileType: "png",
    fileSize: 104373,
    metadata: { width: 1163, height: 1200 },
    uploadedAt: new Date(),
    assetId: "glacier_asset_001",
    s3StorageStatus: {
      storageClass: "GLACIER",
    },
  },
  // The warm half of glacier_mixed_asset_001: a real image on disk (no
  // s3StorageStatus → downloadable), paired with the cold original below so the
  // upload widget's "Download All Originals" batch-restore has one of each.
  {
    id: "goldy-M",
    fileName: "goldy-M.png",
    fileType: "png",
    fileSize: 223837,
    metadata: { width: 1800, height: 1249 },
    uploadedAt: new Date(),
    assetId: "glacier_mixed_asset_001",
  },
  // A few synthetic warm originals (.svg) padding out the same asset's
  // "Download All Originals" batch, so it streams several files and takes a
  // visible moment by hand. No s3StorageStatus → downloadable.
  ...[1, 2, 3].map((n) => ({
    id: `mixed-warm-0${n}`,
    fileName: `mixed-warm-0${n}.svg`,
    fileType: "svg",
    fileSize: 1024,
    metadata: { width: 512, height: 512 },
    uploadedAt: new Date(),
    assetId: "glacier_mixed_asset_001",
  })),
  // The cold original in glacier_mixed_asset_001. /status reports archived from
  // this record; while archived, /download 409s before reading disk. It still
  // needs real bytes on disk (glacier_file_001.tif) so that once a restore
  // completes and it flips to downloadable, the actual download succeeds rather
  // than 404ing.
  {
    id: "glacier_file_001",
    fileName: "glacier-photo.tif",
    fileType: "tif",
    fileSize: 524288,
    metadata: { width: 4000, height: 3000 },
    uploadedAt: new Date(),
    assetId: "glacier_mixed_asset_001",
    s3StorageStatus: {
      storageClass: "GLACIER",
    },
  },
];

export function createFilesTable() {
  const baseTable = createBaseTable((file: MockFile) => file.id, fileSeeds);

  return {
    ...baseTable,
    // Table-specific methods
    getByAssetId: (assetId: string): MockFile[] => {
      return baseTable.filter((f) => f.assetId === assetId);
    },
    create: (data: Omit<MockFile, "uploadedAt">): MockFile => {
      const file: MockFile = {
        ...data,
        uploadedAt: new Date(),
      };
      baseTable.set(file.id, file);
      return file;
    },
    getMetadata: (fileId: string) => {
      const file = baseTable.get(fileId);
      if (!file) {
        return {
          fileId,
          fileName: `file-${fileId}`,
          fileType: "unknown",
          fileSize: 0,
          metadata: {},
        };
      }

      return {
        fileId: file.id,
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        metadata: file.metadata,
        uploadedAt: file.uploadedAt,
      };
    },
  };
}
