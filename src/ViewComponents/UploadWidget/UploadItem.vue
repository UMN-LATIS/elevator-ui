<template>
  <img
    :src="thumbURL"
    :alt="content.fileDescription"
    @click="setAssetInStore(content.fileId, null)"
  />
</template>

<script setup lang="ts">
import { UploadWidgetContents, Widget } from "@/types";
import { setAssetInStore } from "@/Helpers/displayUtils";
import config from "@/config";
import { computed } from "vue";

const props = defineProps<{
  widget: Widget;
  content: UploadWidgetContents;
}>();

const thumbURL = computed(() => {
  return (
    config.baseUrl +
    "/fileManager/getDerivativeById/" +
    props.content.fileId +
    "/tiny2x"
  );
});
</script>
