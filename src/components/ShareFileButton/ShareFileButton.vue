<template>
  <ShareButton :url="url" />
</template>
<script setup lang="ts">
import ShareButton from "@/components/ShareButton/ShareButton.vue";
import { computed } from "vue";
import config from "@/config";

const props = defineProps<{
  fileObjectId: string;
}>();

const url = computed(
  () =>
    `${config.instance.base.url}/asset/getEmbed/${props.fileObjectId}/null/true`
);
</script>
<style scoped></style>
