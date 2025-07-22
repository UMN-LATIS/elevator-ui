import type { FileDownloadResponse } from "../../src/types/FileDownloadTypes";

export const fileDownloads: FileDownloadResponse = {
  original: {
    storageClass: "STANDARD",
    originalFilename: "sample-document.pdf",
    path: "files/original/sample-document.pdf",
    derivativeType: "original",
    metadata: [],
    basePath: "/files",
    baseWebPath: "/files",
    ready: true,
    forcedMimeType: null,
    localAsset: null,
    storageKey: "file123",
    downloadable: true,
  },
  thumbnail: {
    storageClass: "STANDARD",
    originalFilename: "sample-document.pdf",
    path: "files/thumbnail/sample-document.pdf",
    derivativeType: "thumbnail",
    metadata: [],
    basePath: "/files",
    baseWebPath: "/files",
    ready: true,
    forcedMimeType: null,
    localAsset: null,
    storageKey: "file123_thumb",
    downloadable: true,
  },
};

export default fileDownloads;
