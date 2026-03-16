import { defineStore } from "pinia";
import type { FileUploadRecord } from "@/types";

export const useUploadStore = defineStore("uploadStore", {
  state: () => ({
    // Keyed by uploadId. Plain object (not Map) for Pinia reactivity compatibility.
    uploads: {} as Record<string, FileUploadRecord>,
  }),
  getters: {
    hasActiveUploads: (state) =>
      Object.values(state.uploads).some((r) => r.uploadStatus === "in-progress"),
    activeUploads: (state) =>
      Object.values(state.uploads).filter((r) => r.uploadStatus === "in-progress"),
  },
  actions: {
    register(record: FileUploadRecord) {
      this.uploads[record.uploadId] = record;
    },
    complete(uploadId: string, location?: string) {
      const record = this.uploads[uploadId];
      if (record) this.uploads[uploadId] = { ...record, uploadStatus: "completed", location };
    },
    fail(uploadId: string) {
      const record = this.uploads[uploadId];
      if (record) this.uploads[uploadId] = { ...record, uploadStatus: "failed" };
    },
    remove(uploadId: string) {
      delete this.uploads[uploadId];
    },
  },
});
