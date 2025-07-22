export interface FileMetadata {
  fileId: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  filesize: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  metadata: Record<string, unknown>;
}

export const fileMetadata: FileMetadata = {
  fileId: "file123",
  filename: "sample.pdf",
  originalFilename: "sample-document.pdf",
  mimeType: "application/pdf",
  filesize: 1024000,
  width: null,
  height: null,
  duration: null,
  metadata: {},
};

export default fileMetadata;
