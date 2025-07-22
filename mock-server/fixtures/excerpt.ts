export interface ExcerptResponse {
  excerptId: number;
  name: string;
  startTime: number;
  endTime: number;
  fileHandlerId: string;
  assetId: string;
}

export const excerpt: ExcerptResponse = {
  excerptId: 1,
  name: "Test Excerpt",
  startTime: 30,
  endTime: 60,
  fileHandlerId: "file123",
  assetId: "12345"
};

export default excerpt;