<template>
  <img
    v-if="assetCache.primaryHandler"
    :src="getTinyURL(assetCache.primaryHandler)"
    :alt="assetCache.relatedAssetTitle[0]"
    @click="setAssetInStore(assetCache.primaryHandler, content.targetAssetId)"
  />
</template>

<script setup lang="ts">
import { Widget, RelatedWidgetContents } from "@/types";
import UploadItem from "@/ViewComponents/UploadWidget/UploadItem";
import { getTinyURL, setAssetInStore } from "@/Helpers/displayUtils";
import { useTemplateStore } from "@/stores/templateStore";
const templateStore = useTemplateStore();

interface Props {
  widget: Widget;
  content: RelatedWidgetContents;
  assetCache: any;
}

const props = defineProps<Props>();
</script>
