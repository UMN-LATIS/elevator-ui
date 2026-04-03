<template>
  <ShareButton class="share-file-button" :url="url" :embedTitle="embedTitle" />
</template>
<script setup lang="ts">
import ShareButton from "@/components/ShareButton/ShareButton.vue";
import { computed } from "vue";
import config from "@/config";

const props = withDefaults(
  defineProps<{
    fileObjectId: string;
    embedTitle?: string;
  }>(),
  {
    embedTitle: "Embedded asset",
  }
);

const url = computed(
  () =>
    `${config.instance.base.url}/asset/getEmbed/${props.fileObjectId}/null/true`
);
</script>
<style scoped></style>
