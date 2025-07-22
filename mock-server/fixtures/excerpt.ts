import type { ApiGetExcerptResponse } from "../../src/types/index";

export const excerpt: ApiGetExcerptResponse = {
  id: 1,
  label: "Test Excerpt",
  startTime: 30,
  endTime: 60,
  fileObjectId: "file123",
  isEmbedded: false,
  embedUrl: "",
  assetId: "12345"
};

export default excerpt;