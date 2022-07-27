<template>
    <div>

        <img v-if="assetCache.primaryHandler" :src="getTinyURL(assetCache.primaryHandler)"
            :alt="assetCache.relatedAssetTitle[0]" class="tinyImage"
            @click="setAssetInStore(assetCache.primaryHandler, content.targetAssetId)" />
        <a href="#" @click.prevent="show = !show">
            {{
            getRelatedAssetTitle(assetCache.relatedAssetTitle)
            }}
        </a>
        <ViewWrapper v-if=" show" :objectId="content.targetAssetId"></ViewWrapper>
    </div>
</template>

<script setup lang="ts">
import { Widget, RelatedWidgetContents } from "@/types";
import UploadItem from "@/ViewComponents/UploadWidget/UploadItem.vue";
import { getAssetLink, getRelatedAssetTitle, getTinyURL, getAsset, setAssetInStore } from "@/Helpers/displayUtils";
import ViewWrapper from "@/ViewComponents/ViewWrapper.vue";
import { onMounted, ref } from 'vue';
import { useTemplateStore } from "@/stores/templateStore";

const templateStore = useTemplateStore();

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
            nestedTemplate.value = await templateStore.loadTemplate(nestedAsset.value.templateId);
        }

    }
});


</script>

<style scoped>
div {
    border: 1px solid #ccc;
    }
    
    .tinyImage {
        max-width: 50px;
        max-height: 50px;
    }
</style>