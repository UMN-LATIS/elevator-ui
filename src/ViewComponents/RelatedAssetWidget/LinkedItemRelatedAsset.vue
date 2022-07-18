<template>
    <a :href="getAssetLink(widget.targetAssetId)">
        {{ getRelatedAssetTitle(assetCache.relatedAssetTitle) }}
    </a>
</template>

<script setup lang="ts">
import { Widget, RelatedWidgetContents } from "@/types";
import UploadItem from "@/ViewComponents/UploadWidget/UploadItem.vue";
import { getAssetLink, getRelatedAssetTitle } from "@/Helpers/displayUtils";

interface Props {
    widget: Widget;
    contents: RelatedWidgetContents;
    assetCache: any;
}

const props = defineProps<Props>();


</script>
