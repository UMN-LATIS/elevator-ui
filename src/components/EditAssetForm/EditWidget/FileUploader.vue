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

defineProps<{
  collectionId: number;
}>();

const uppy = new Uppy().use(umnAwsS3, {
  endpoint: "http://localhost:3000",
  shouldUseMultipart: true,
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
