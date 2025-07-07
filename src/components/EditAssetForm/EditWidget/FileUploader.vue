<template>
  <div class="upload-container">
    <Dashboard :uppy="uppy" />
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

const props = defineProps<{
  collectionId: number;
}>();

const uppy = new Uppy().use(umnAwsS3, {
  endpoint: "http://localhost:3000",
  shouldUseMultipart: true,
});
</script>
