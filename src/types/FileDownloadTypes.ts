// AWS S3 storage classes used by the Elevator backend (see constants.php
export type StorageClass =
  | "STANDARD"
  | "REDUCED_REDUNDANCY"
  | "STANDARD_IA"
  | "GLACIER" // retore needed before download
  | "GLACIER_IR"
  | "RESTORED";

export type FileDownloadResponse = Record<string, FileDownloadDetails>;

export interface FileDownloadDetails {
  storageClass: StorageClass;
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
  downloadable: boolean;
}
