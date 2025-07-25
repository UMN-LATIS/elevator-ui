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
