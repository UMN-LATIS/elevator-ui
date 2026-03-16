import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useUploadStore } from "./uploadStore";
import type { FileUploadRecord } from "@/types";

function makeRecord(overrides: Partial<FileUploadRecord> = {}): FileUploadRecord {
  return {
    filename: "test.mp4",
    fileObjectId: "obj-1",
    contentType: "video/mp4",
    uploadId: "upload-1",
    key: "path/to/test.mp4",
    uploadStatus: "in-progress",
    ...overrides,
  };
}

describe("uploadStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe("hasActiveUploads", () => {
    it("is false when the store is empty", () => {
      const store = useUploadStore();
      expect(store.hasActiveUploads).toBe(false);
    });

    it("is true when there is an in-progress upload", () => {
      const store = useUploadStore();
      store.register(makeRecord());
      expect(store.hasActiveUploads).toBe(true);
    });

    it("is false when all uploads are completed", () => {
      const store = useUploadStore();
      store.register(makeRecord({ uploadId: "u1", uploadStatus: "in-progress" }));
      store.complete("u1");
      expect(store.hasActiveUploads).toBe(false);
    });

    it("is false when all uploads are failed", () => {
      const store = useUploadStore();
      store.register(makeRecord({ uploadId: "u1", uploadStatus: "in-progress" }));
      store.fail("u1");
      expect(store.hasActiveUploads).toBe(false);
    });

    it("stays true while at least one upload remains in progress", () => {
      const store = useUploadStore();
      store.register(makeRecord({ uploadId: "u1", filename: "a.mp4" }));
      store.register(makeRecord({ uploadId: "u2", filename: "b.mp4" }));
      store.complete("u1");
      expect(store.hasActiveUploads).toBe(true);
    });
  });

  describe("activeUploads", () => {
    it("returns only in-progress records", () => {
      const store = useUploadStore();
      store.register(makeRecord({ uploadId: "u1", filename: "a.mp4" }));
      store.register(makeRecord({ uploadId: "u2", filename: "b.mp4" }));
      store.complete("u2");
      expect(store.activeUploads).toHaveLength(1);
      expect(store.activeUploads[0].uploadId).toBe("u1");
    });
  });

  describe("register", () => {
    it("adds the record keyed by uploadId", () => {
      const store = useUploadStore();
      const record = makeRecord();
      store.register(record);
      expect(store.uploads["upload-1"]).toEqual(record);
    });
  });

  describe("complete", () => {
    it("sets uploadStatus to completed", () => {
      const store = useUploadStore();
      store.register(makeRecord({ uploadId: "u1" }));
      store.complete("u1");
      expect(store.uploads["u1"].uploadStatus).toBe("completed");
    });

    it("sets location when provided", () => {
      const store = useUploadStore();
      store.register(makeRecord({ uploadId: "u1" }));
      store.complete("u1", "https://s3.example.com/path/to/file.mp4");
      expect(store.uploads["u1"].location).toBe("https://s3.example.com/path/to/file.mp4");
    });

    it("is a no-op for unknown uploadIds", () => {
      const store = useUploadStore();
      expect(() => store.complete("nonexistent")).not.toThrow();
    });
  });

  describe("fail", () => {
    it("sets uploadStatus to failed", () => {
      const store = useUploadStore();
      store.register(makeRecord({ uploadId: "u1" }));
      store.fail("u1");
      expect(store.uploads["u1"].uploadStatus).toBe("failed");
    });

    it("is a no-op for unknown uploadIds", () => {
      const store = useUploadStore();
      expect(() => store.fail("nonexistent")).not.toThrow();
    });
  });

  describe("remove", () => {
    it("deletes the record from uploads", () => {
      const store = useUploadStore();
      store.register(makeRecord({ uploadId: "u1" }));
      store.remove("u1");
      expect(store.uploads["u1"]).toBeUndefined();
      expect(store.hasActiveUploads).toBe(false);
    });

    it("is a no-op for unknown uploadIds", () => {
      const store = useUploadStore();
      expect(() => store.remove("nonexistent")).not.toThrow();
    });
  });
});
