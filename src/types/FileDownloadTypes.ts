export type FileDownloadResponse = Record<string, FileDownloadDetails>;

export interface FileDownloadDetails {
  storageClass: string;
  originalFilename: string;
  path: string;
  derivativeType: string;
  metadata: unknown[];
  basePath: string;
  baseWebPath: string;
  ready: boolean;
  forcedMimeType: null;
  localAsset: null;
  storageKey: string;
}
