<template>
  <img
    :src="thumbURL"
    :alt="content.fileDescription"
    @click="assetStore.setActiveAsset(content.fileId)"
  />
</template>

<script setup lang="ts">
import { UploadWidgetContent, WidgetProps } from "@/types";
// import { setAssetInStore } from "@/helpers/displayUtils";
import config from "@/config";
import { computed } from "vue";
import { useAssetStore } from "@/stores/assetStore";

const props = defineProps<{
  widget: WidgetProps;
  content: UploadWidgetContent;
}>();

const assetStore = useAssetStore();

const thumbURL = computed(() => {
  return (
    config.baseUrl +
    "/fileManager/getDerivativeById/" +
    props.content.fileId +
    "/tiny2x"
  );
});
</script>
