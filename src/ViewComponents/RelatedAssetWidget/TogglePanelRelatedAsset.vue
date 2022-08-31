<template>
  <div>
    <img
      v-if="assetCache.primaryHandler"
      :src="getTinyURL(assetCache.primaryHandler)"
      :alt="assetCache.relatedAssetTitle[0]"
      class="tinyImage"
      @click="handleImageClick"
    />
    <button @click="show = !show">
      {{ getRelatedAssetTitle(assetCache.relatedAssetTitle) }}
    </button>
    <ViewWrapper
      v-if="show && content.targetAssetId"
      :objectId="content.targetAssetId"
      :isPrimaryElement="false"
    >
    </ViewWrapper>
  </div>
</template>

<script setup lang="ts">
import {
  RelatedAssetWidget,
  RelatedAssetWidgetContents,
  RelatedAsset,
  Template,
  Asset,
} from "@/types";
import {
  getRelatedAssetTitle,
  getTinyURL,
  getAsset,
  setAssetInStore,
} from "@/Helpers/displayUtils";
import { onMounted, ref } from "vue";
import { useTemplateStore } from "@/stores/templateStore";
import ViewWrapper from "../ViewWrapper.vue";

const templateStore = useTemplateStore();

interface Props {
  widget: RelatedAssetWidget;
  content: RelatedAssetWidgetContents;
  assetCache: RelatedAsset;
}

const props = defineProps<Props>();

const nestedAsset = ref<Asset | null>(null);
const nestedTemplate = ref<Template | null>(null);
const show = ref(false);

onMounted(async () => {
  if (props.content.targetAssetId) {
    nestedAsset.value = await getAsset(props.content.targetAssetId);
    if (nestedAsset.value.templateId) {
      nestedTemplate.value = await templateStore.loadTemplate(
        nestedAsset.value.templateId
      );
    }
  }
});

function handleImageClick() {
  if (!props.assetCache?.primaryHandler) {
    throw new Error("No assetCache primary hanrdler");
  }
  setAssetInStore(props.assetCache.primaryHandler, props.content.targetAssetId);
}
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
