<template>
    <div>
        <a href="#" @click.prevent="show = !show">{{ getRelatedAssetTitle(assetCache.relatedAssetTitle) }}</a>
        <ViewWrapper v-if="show" :objectId="content.targetAssetId"></ViewWrapper>
    </div>
</template>

<script setup lang="ts">
import { Widget, RelatedWidgetContents } from "@/types";
import UploadItem from "@/ViewComponents/UploadWidget/UploadItem.vue";
import { getAssetLink, getRelatedAssetTitle, getAsset, getTemplate } from "@/Helpers/displayUtils";
import ViewWrapper from "@/ViewComponents/ViewWrapper.vue";
import { onMounted, ref } from 'vue';

interface Props {
    widget: Widget;
    content: RelatedWidgetContents;
    assetCache: any;
}

const props = defineProps<Props>();

const nestedAsset: any = ref(null);
const nestedTemplate = ref(null);
const show = ref(false);

onMounted(async () => {
    if (props.content.targetAssetId) {
        nestedAsset.value = await getAsset(props.content.targetAssetId);
        if (nestedAsset.value.templateId) {
            nestedTemplate.value = await getTemplate(nestedAsset.value.templateId);
        }

    }
});


</script>

<style scoped>
div {
    border: 1px solid #ccc;
}
</style>