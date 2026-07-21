<template>
  <div class="file-uploader">
    <Dashboard
      :uppy="uppy"
      :inline="false"
      :props="{
        height: 'auto',
        width: '100%',
        proudlyDisplayPoweredByUppy: false,
        note,
        theme: uppyTheme,
      }" />
  </div>
</template>

<script setup lang="ts">
import * as Type from "@/types";
import { Dashboard } from "@uppy/vue";
import Uppy from "@uppy/core";
import umnAwsS3 from "@umn-cla/uppy-aws-s3";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import "@uppy/drag-drop/dist/style.min.css";
import "@uppy/status-bar/dist/style.min.css";
import "@uppy/progress-bar/dist/style.min.css";
import config from "@/config";
import api from "@/api";
import { pluralize } from "@/helpers/pluralize";
import { computed, onBeforeUnmount } from "vue";
import { useUploadStore } from "@/stores/uploadStore";
import { useTheming } from "@/helpers/useTheming";

const props = defineProps<{
  collectionId: number;
  maxNumberOfFiles?: number;
}>();

const emit = defineEmits<{
  (e: "start", fileRecord: Type.FileUploadRecord): void;
  (e: "complete", fileRecord: Type.FileUploadRecord): void;
  (e: "error", error: Error): void;
}>();

const uploadStore = useUploadStore();

const { effectiveTheme } = useTheming();

// Explicit list of themes that should use Uppy's dark color scheme.
const DARK_THEMES = new Set([
  "construction",
  "dark",
  "hotrod",
  "matrix",
  "nord-dark",
  "tron",
  "vaporwave",
]);

const uppyTheme = computed<"dark" | "light">(() =>
  DARK_THEMES.has(effectiveTheme.value ?? "") ? "dark" : "light"
);

// Local index: filename → uploadId.
const filenameToUploadId = new Map<string, string>();

const note = computed(() => {
  if (props.maxNumberOfFiles) {
    return `${props.maxNumberOfFiles} ${pluralize(
      props.maxNumberOfFiles,
      "file"
    )} maximum`;
  }
  return null;
});

const uppy = new Uppy({
  autoProceed: true,
  restrictions: {
    maxNumberOfFiles: props.maxNumberOfFiles,
  },
}).use(umnAwsS3, {
  endpoint: config.instance.base.url,
  shouldUseMultipart: true,
  // AWS S3 allows up to 10k parts per multipart upload.
  // support up to 2TB file size w/200MB part size (200MB * 10k = 2TB)
  getChunkSize: () => 200 * 1024 * 1024, // 200MB
  async createMultipartUpload(file): Promise<{
    uploadId: string;
    key: string;
  }> {
    // our backend expects:
    // - collectionId
    // - fileObjectId
    // - contentType

    // To get the fileObjectId, we need to first make a request
    // to `/assetManager/getFileContainer`

    if (!file.name) {
      throw new Error("File name is required to create a multipart upload.");
    }

    const fileContainers = await api.getFileContainer({
      collectionId: props.collectionId,
      filename: file.name,
    });

    if (!fileContainers || fileContainers.length === 0) {
      throw new Error(
        "No file containers found for the given collection and filename."
      );
    }

    const { fileObjectId } = fileContainers[0];

    // then we can start the multipart upload
    const { uploadId, key } = await api.startS3MultipartUpload({
      fileObjectId,
      collectionId: props.collectionId,
      contentType: file.type,
    });

    const fileRecord: Type.FileUploadRecord = {
      filename: file.name,
      fileObjectId,
      contentType: file.type,
      uploadId,
      key,
      uploadStatus: "in-progress",
    };

    filenameToUploadId.set(file.name, uploadId);
    uploadStore.register(fileRecord);

    emit("start", fileRecord);

    return { uploadId, key };
  },
  async signPart(
    file,
    partData
  ): Promise<{
    url: string;
    headers?: Record<string, string>;
  }> {
    if (!file.name) {
      throw new Error("File name is required to sign a part.");
    }

    const uploadId = filenameToUploadId.get(file.name);

    if (!uploadId) {
      throw new Error(
        `No upload record found for file: ${file.name}. Please ensure the file upload has been started.`
      );
    }

    const record = uploadStore.uploads[uploadId];

    if (!record) {
      throw new Error(
        `Upload record missing from store for uploadId: ${uploadId}.`
      );
    }

    const { url } = await api.signS3UploadPart({
      collectionId: props.collectionId,
      fileObjectId: record.fileObjectId,
      uploadId: record.uploadId,
      partNumber: partData.partNumber,
      contentType: record.contentType,
    });

    return { url };
  },

  async completeMultipartUpload(file): Promise<{
    location?: string; // S3 URL of the uploaded file
  }> {
    if (!file.name) {
      throw new Error("File name is required to complete a multipart upload.");
    }

    const uploadId = filenameToUploadId.get(file.name);

    if (!uploadId) {
      throw new Error(
        `No upload record found for file: ${file.name}. Please ensure the file upload has been started.`
      );
    }

    const record = uploadStore.uploads[uploadId];

    if (!record) {
      throw new Error(
        `Upload record missing from store for uploadId: ${uploadId}.`
      );
    }

    let location: string | undefined;
    try {
      ({ location } = await api.completeS3MultipartUpload({
        collectionId: props.collectionId,
        fileObjectId: record.fileObjectId,
        uploadId: record.uploadId,
        contentType: record.contentType,
      }));

      // notify elevator backend that the upload is complete
      await api.completeSourceFile(record.fileObjectId);

      const completedRecord: Type.FileUploadRecord = {
        ...record,
        uploadStatus: "completed",
        location,
      };

      // emit the complete event with the updated file record
      emit("complete", completedRecord);
    } finally {
      filenameToUploadId.delete(file.name);
      uploadStore.remove(uploadId);
    }

    return { location };
  },

  async abortMultipartUpload(file): Promise<void> {
    if (!file.name) {
      throw new Error("File name is required to abort a multipart upload.");
    }

    const uploadId = filenameToUploadId.get(file.name);

    if (!uploadId) {
      throw new Error(
        `No upload record found for file: ${file.name}. Please ensure the file upload has been started.`
      );
    }

    const record = uploadStore.uploads[uploadId];

    if (!record) {
      throw new Error(
        `Upload record missing from store for uploadId: ${uploadId}.`
      );
    }

    await api.abortS3MultipartUpload({
      collectionId: props.collectionId,
      fileObjectId: record.fileObjectId,
      uploadId: record.uploadId,
      contentType: record.contentType,
    });

    filenameToUploadId.delete(file.name);
    uploadStore.remove(uploadId);
  },
});

// clear upload state on success
uppy.on("complete", ({ successful, _failed }) => {
  successful?.forEach((file) => uppy.removeFile(file.id));
});

uppy.on("error", (error) => {
  // todo handle error
  console.error("Uppy error:", error);
  emit("error", error);
});

// If the component is destroyed while uploads are in flight (e.g. user confirmed
// leaving in the navigation dialog), remove any orphaned records from the store.
onBeforeUnmount(() => {
  filenameToUploadId.forEach((uploadId) => uploadStore.remove(uploadId));
  filenameToUploadId.clear();
});
</script>

<style>
.file-uploader {
  & .uppy-Dashboard-inner {
    /* prevent uppy z-index conflicts with our modals */
    isolation: isolate;
    border: 0;
    background: transparent;
  }
  & .uppy-Dashboard-dropFilesHereHint {
    padding: 0;
  }
  & .uppy-Dashboard-AddFiles {
    @apply border-2 border-outline-variant bg-surface-container text-on-surface hover:border-primary hover:bg-surface-container rounded-lg flex flex-col items-center justify-center p-4 transition-colors focus-within:ring-2 focus-within:ring-primary;
  }

  & .uppy-Dashboard-AddFiles-info {
    @apply flex items-center justify-center p-0 static;

    & .uppy-Dashboard-note {
      @apply text-xs text-on-surface-variant;
    }
  }

  & .uppy-Dashboard-AddFiles-list {
    @apply m-0;
  }

  & .uppy-Dashboard-AddFiles-title {
    font-size: 0.825rem;
    color: var(--on-surface);
  }
}
</style>
