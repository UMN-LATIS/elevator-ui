export interface FileDownloadInfo {
  ready: boolean;
  originalFilename: string;
  downloadable: boolean;
}

export interface FileDownloads {
  original: FileDownloadInfo;
  thumbnail: FileDownloadInfo;
}

export const fileDownloads: FileDownloads = {
  original: {
    ready: true,
    originalFilename: "sample-document.pdf",
    downloadable: true,
  },
  thumbnail: {
    ready: true,
    originalFilename: "sample-document.pdf",
    downloadable: true,
  },
};

export default fileDownloads;
