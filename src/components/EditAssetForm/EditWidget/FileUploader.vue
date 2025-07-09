<template>
  <div class="file-uploader">
    <Dashboard
      :uppy="uppy"
      :inline="false"
      :props="{
        height: 'auto',
        width: '100%',
      }" />
  </div>
</template>

<script setup lang="ts">
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

const props = defineProps<{
  collectionId: number;
}>();

const filenameToObjectIdMap = new Map<
  string, // filename
  {
    filename: string;
    fileObjectId: string;
    contentType: string;
    uploadId: string;
    key: string; // s3 "key" aka path to the file in S3
  }
>();

const uppy = new Uppy().use(umnAwsS3, {
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

    // store the fileObjectId on the file meta data for later use
    file.meta.fileObjectId = fileObjectId;

    // then we can start the multipart upload
    const { uploadId, key } = await api.startS3MultipartUpload({
      fileObjectId,
      collectionId: props.collectionId,
      contentType: file.type,
    });

    filenameToObjectIdMap.set(file.name, {
      filename: file.name,
      fileObjectId,
      contentType: file.type,
      uploadId,
      key,
    });

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

    console.log({
      file,
      partData,
      fileObjectId: file.meta.fileObjectId,
      filenameToObjectIdMap,
    });

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

    return { location };
  },
});
</script>

<style>
.file-uploader {
  & .uppy-Dashboard-inner {
    border: 0;
  }
  & .uppy-Dashboard-dropFilesHereHint {
    padding: 0;
  }
  & .uppy-Dashboard-AddFiles {
    @apply border border-black/10 bg-black/5 rounded-lg flex flex-col items-center justify-center p-4;
  }

  & .uppy-Dashboard-AddFiles-list {
    @apply m-0;
  }

  & .uppy-Dashboard-AddFiles-title {
    font-size: 0.825rem;
  }
}
</style>
