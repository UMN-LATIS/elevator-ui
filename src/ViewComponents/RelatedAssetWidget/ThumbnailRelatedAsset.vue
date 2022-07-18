<template>
    <img :src="getTinyURL(assetCache.primaryHandler)" :alt="assetCache.relatedAssetTitle[0]" />
</template>

<script setup lang="ts">
import { Widget, RelatedWidgetContents } from "@/types";
import UploadItem from "@/ViewComponents/UploadWidget/UploadItem";
import { getTinyURL } from "@/Helpers/displayUtils";

interface Props {
    widget: Widget;
    contents: RelatedWidgetContents;
    assetCache: any;
}

const props = defineProps<Props>();



</script>
