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
import { computed } from "vue";

const props = defineProps<{
  collectionId: number;
  maxNumberOfFiles?: number;
}>();

const emit = defineEmits<{
  (e: "start", fileRecord: Type.FileUploadRecord): void;
  (e: "complete", fileRecord: Type.FileUploadRecord): void;
  (e: "allComplete"): void;
  (e: "error", error: Error): void;
}>();

const filenameToObjectIdMap = new Map<
  string, // filename
  Type.FileUploadRecord
>();

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

    filenameToObjectIdMap.set(file.name, fileRecord);

    emit("start", fileRecord);

    return {
      uploadId,
      key,
    };
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

    const fileRecord = filenameToObjectIdMap.get(file.name);

    if (!fileRecord) {
      throw new Error(
        `No file record found for file: ${file.name}. Please ensure the file upload has been started.`
      );
    }

    const { url } = await api.signS3UploadPart({
      collectionId: props.collectionId,
      fileObjectId: fileRecord.fileObjectId,
      uploadId: fileRecord.uploadId,
      partNumber: partData.partNumber,
      contentType: fileRecord.contentType,
    });

    return { url };
  },

  async completeMultipartUpload(file): Promise<{
    location?: string; // S3 URL of the uploaded file
  }> {
    if (!file.name) {
      throw new Error("File name is required to complete a multipart upload.");
    }

    const fileRecord = filenameToObjectIdMap.get(file.name);

    if (!fileRecord) {
      throw new Error(
        `No file record found for file: ${file.name}. Please ensure the file upload has been started.`
      );
    }

    const { location } = await api.completeS3MultipartUpload({
      collectionId: props.collectionId,
      fileObjectId: fileRecord.fileObjectId,
      uploadId: fileRecord.uploadId,
      contentType: fileRecord.contentType,
    });

    // notify elevator backend that the upload is complete
    await api.completeSourceFile(fileRecord.fileObjectId);

    const updatedFileRecord: Type.FileUploadRecord = {
      ...fileRecord,
      uploadStatus: "completed",
      location, // store the S3 URL of the uploaded file
    };
    // update the file record status
    filenameToObjectIdMap.set(file.name, updatedFileRecord);

    // emit the complete event with the updated file record
    emit("complete", updatedFileRecord);

    return { location };
  },

  async abortMultipartUpload(file): Promise<void> {
    if (!file.name) {
      throw new Error("File name is required to abort a multipart upload.");
    }

    const fileRecord = filenameToObjectIdMap.get(file.name);

    if (!fileRecord) {
      throw new Error(
        `No file record found for file: ${file.name}. Please ensure the file upload has been started.`
      );
    }

    await api.abortS3MultipartUpload({
      collectionId: props.collectionId,
      fileObjectId: fileRecord.fileObjectId,
      uploadId: fileRecord.uploadId,
      contentType: fileRecord.contentType,
    });

    // remove the file record from the map
    filenameToObjectIdMap.delete(file.name);
  },
});

// clear upload state on success
uppy.on("complete", ({ successful, _failed }) => {
  successful?.forEach((file) => uppy.removeFile(file.id));
  emit("allComplete");
});

uppy.on("error", (error) => {
  // todo handle error
  console.error("Uppy error:", error);
  emit("error", error);
});
</script>

<style>
.file-uploader {
  & .uppy-Dashboard-inner {
    /* prevent uppy z-index conflicts with our modals */
    isolation: isolate;
    border: 0;
  }
  & .uppy-Dashboard-dropFilesHereHint {
    padding: 0;
  }
  & .uppy-Dashboard-AddFiles {
    @apply border-2 border-outline-variant bg-surface-container hover:border-primary rounded-lg flex flex-col items-center justify-center p-4 transition-colors focus-within:ring-2 focus-within:ring-primary;
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
  }
}
</style>
