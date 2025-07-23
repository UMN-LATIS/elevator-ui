// Mock file model for the mock server

interface MockFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
    pages?: number;
  };
  uploadedAt: Date;
  assetId?: string;
}

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

const fileStore = new Map<MockFile["id"], MockFile>(
  fileSeeds.map((file) => [file.id, file])
);

export const files = {
  get: (fileId: string): MockFile | undefined => {
    return fileStore.get(fileId);
  },
  getAll: (): MockFile[] => {
    return Array.from(fileStore.values());
  },
  getByAssetId: (assetId: string): MockFile[] => {
    return Array.from(fileStore.values()).filter(f => f.assetId === assetId);
  },
  create: (data: Omit<MockFile, "uploadedAt">): MockFile => {
    const file: MockFile = {
      ...data,
      uploadedAt: new Date(),
    };
    fileStore.set(file.id, file);
    return file;
  },
  delete: (fileId: string): void => {
    fileStore.delete(fileId);
  },
  getMetadata: (fileId: string) => {
    const file = fileStore.get(fileId);
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