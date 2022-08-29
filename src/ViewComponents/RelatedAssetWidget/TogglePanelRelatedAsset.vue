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
        <ViewWrapper v-if="show" :objectId="content.targetAssetId" :isPrimaryElement="false">
        </ViewWrapper>
    </div>
</template>

<script setup lang="ts">
import { Widget, RelatedWidgetContents } from "@/types";
import UploadItem from "@/ViewComponents/UploadWidget/UploadItem.vue";
import { getAssetLink, getRelatedAssetTitle, getTinyURL, getAsset, setAssetInStore } from "@/Helpers/displayUtils";
import { onMounted, ref } from 'vue';
import { useTemplateStore } from "@/stores/templateStore";
import ViewWrapper from "../ViewWrapper.vue";

const templateStore = useTemplateStore();

interface Props {
    widget: Widget;
    content: RelatedWidgetContents;
    assetCache: any;
}

const props = defineProps<Props>();

const show = ref(false);



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