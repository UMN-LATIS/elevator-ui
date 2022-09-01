<template>
  <iframe
    v-if="fileObjectId"
    :src="embedLink"
    :style="{ width: '100%', height: '100%' }"
    frameBorder="0"
    allowfullscreen="true"
  ></iframe>
</template>

<script setup lang="ts">
import { computed } from "vue";
import config from "@/config";

const props = defineProps<{
  fileObjectId: string;
  objectId: string;
}>();

const embedLink = computed(
  () =>
    `${config.baseUrl}/asset/getEmbed/${props.fileObjectId}/${props.objectId}`
);
</script>
