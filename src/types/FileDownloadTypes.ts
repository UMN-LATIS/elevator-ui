export interface FileDownloadResponse {
  screen: Screen;
  thumbnail: Screen;
  thumbnail2x: Screen;
  tiny: Screen;
  tiny2x: Screen;
}

export interface Screen {
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
