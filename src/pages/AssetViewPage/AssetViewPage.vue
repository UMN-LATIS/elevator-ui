<template>
  <DefaultLayout v-if="isPageLoaded">
    <MetaDataOnlyView
      v-if="isMetaDataOnly"
      :assetId="assetStore.activeAssetId"
    />
    <AssetView
      v-else
      :assetId="assetStore.activeAssetId"
      :objectId="assetStore.activeObjectId"
    />
  </DefaultLayout>
</template>
<script setup lang="ts">
import config from "@/config";
import { ref, watch, computed } from "vue";
import { useAssetStore } from "@/stores/assetStore";
import { useRoute } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AssetView from "./AssetView.vue";
import MetaDataOnlyView from "./MetaDataOnlyView.vue";
import { getAssetTitle } from "@/helpers/displayUtils";
import { useTitle } from "@vueuse/core";
import { striptags } from "striptags";

const assetStore = useAssetStore();
const isMetaDataOnly = computed(() => !assetStore.activeFileObjectId);
const isPageLoaded = ref(false);
const route = useRoute();
const props = withDefaults(
  defineProps<{
    assetId: string;
    objectId?: string | null;
  }>(),
  { objectId: null }
);

const objectId = computed(
  () => route.hash?.substring(1) || props.objectId || null
);

const pageTitle = useTitle(`Loading... | ${config.instance.name}`);

async function onAssetIdChange() {
  // to prevent page format from shifting from MetaDataOnlyPage
  // to the normal AssetViewPage, we need to track the page status
  // to begin, whenever the assetId changes, the page is a `loading` state
  // once the asset is loaded, we can determine if this should be a
  // `metadata-only-page` or a `asset-with-viewer-page`
  isPageLoaded.value = false;
  const asset = await assetStore.setActiveAsset(props.assetId, objectId.value);

  // if there's no asset we're done
  if (!asset) {
    pageTitle.value = `Asset not found | ${config.instance.name}`;
    isPageLoaded.value = true;
    return;
  }

  // if there's an asset, set the page title
  const assetTitle = getAssetTitle(asset);
  pageTitle.value = `${striptags(assetTitle)} | ${config.instance.name}`;
  useTitle(pageTitle);

  isPageLoaded.value = true;
}

watch([() => props.assetId, () => route.params?.assetId], onAssetIdChange, {
  immediate: true,
});

watch([() => props.objectId, () => route.hash], async () => {
  await assetStore.setActiveObject(objectId.value);
});
</script>
<style scoped></style>
