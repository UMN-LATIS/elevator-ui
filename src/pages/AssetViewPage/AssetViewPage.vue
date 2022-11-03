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
import { ref, watch, computed } from "vue";
import { useAssetStore } from "@/stores/assetStore";
import { useRoute } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AssetView from "./AssetView.vue";
import MetaDataOnlyView from "./MetaDataOnlyView.vue";

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

watch(
  [() => props.assetId, () => route.params?.assetId],
  async () => {
    // to prevent page format from shifting from MetaDataOnlyPage
    // to the normal AssetViewPage, we need to track the page status
    // to begin, whenever the assetId changes, the page is a `loading` state
    // once the asset is loaded, we can determine if this should be a
    // `metadata-only-page` or a `asset-with-viewer-page`
    isPageLoaded.value = false;
    await assetStore.setActiveAsset(props.assetId, objectId.value);

    // if this has no firstFileObjectId, then there's
    // nothing to view, and thus metadata only. Otherwise
    // we need a viewer
    isPageLoaded.value = true;
  },
  { immediate: true }
);

watch([() => props.objectId, () => route.hash], async () => {
  await assetStore.setActiveObject(objectId.value);
});
</script>
<style scoped></style>
