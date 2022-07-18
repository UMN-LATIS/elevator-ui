<template>
    <div>
        {{ getRelatedAssetTitle(assetCache.relatedAssetTitle) }}
        <ViewWrapper :objectId="content.targetAssetId"></ViewWrapper>
    </div>
</template>

<script setup lang="ts">
import { Widget, RelatedWidgetContents } from "@/types";
import UploadItem from "@/ViewComponents/UploadWidget/UploadItem.vue";
import { getRelatedAssetTitle } from "@/Helpers/displayUtils";
import ViewContainer from "@/ViewComponents/ViewContainer.vue";
import ViewWrapper from "@/ViewComponents/ViewWrapper.vue";

interface Props {
    widget: Widget;
    content: RelatedWidgetContents;
    assetCache: any;
}

const props = defineProps<Props>();



</script>

<style scoped>
div {
    border: 1px solid #ccc;
}
</style>