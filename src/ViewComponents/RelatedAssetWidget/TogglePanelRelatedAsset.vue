<template>
  <div>
    <img
      v-if="assetCache.primaryHandler"
      :src="getTinyURL(assetCache.primaryHandler)"
      :alt="assetCache.relatedAssetTitle[0]"
      class="tinyImage"
      @click="setAssetInStore(assetCache.primaryHandler, content.targetAssetId)"
    />
    <a href="#" @click.prevent="show = !show">
      {{ getRelatedAssetTitle(assetCache.relatedAssetTitle) }}
    </a>
    <ViewContainer
      v-if="show"
      :objectId="content.targetAssetId"
      :isPrimaryElement="false"
    >
    </ViewContainer>
  </div>
</template>

<script setup lang="ts">
import {
  Widget,
  RelatedWidgetContents,
  RelatedAsset,
  Template,
  Asset,
} from "@/types";
import UploadItem from "@/ViewComponents/UploadWidget/UploadItem.vue";
import {
  getAssetLink,
  getRelatedAssetTitle,
  getTinyURL,
  getAsset,
  setAssetInStore,
} from "@/Helpers/displayUtils";
import { onMounted, ref } from "vue";
import { useTemplateStore } from "@/stores/templateStore";
import ViewContainer from "../ViewContainer.vue";

const templateStore = useTemplateStore();

interface Props {
  widget: Widget;
  content: RelatedWidgetContents;
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
