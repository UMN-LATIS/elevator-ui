<template>
  <div
    class="asset-view-page bg-neutral-300"
    :class="{
      'is-asset-details-open': isAssetDetailsOpen,
      'is-object-details-open': isObjectDetailsOpen,
    }"
  >
    <ObjectViewer
      class="asset-view-page__viewer overflow-hidden bg-neutral-100"
      :fileHandlerId="assetStore.activeFileObjectId"
    />
    <AssetDetailsDrawer
      class="asset-view-page__asset-details overflow-hidden"
      :assetId="assetStore.activeAssetId"
      :isOpen="isAssetDetailsOpen"
      @toggle="isAssetDetailsOpen = !isAssetDetailsOpen"
    />
    <ObjectDetailsDrawer
      class="asset-viewpage__object-details overflow-hidden"
      :objectId="assetStore.activeObjectId"
      :isOpen="isObjectDetailsOpen"
      @toggle="isObjectDetailsOpen = !isObjectDetailsOpen"
    />
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";
import { useAssetStore } from "@/stores/assetStore";
import ObjectViewer from "@/components/ObjectViewer/ObjectViewer.vue";
import ObjectDetailsDrawer from "@/components/ObjectDetailsDrawer/ObjectDetailsDrawer.vue";
import AssetDetailsDrawer from "@/components/AssetDetailsDrawer/AssetDetailsDrawer.vue";

const props = defineProps<{
  assetId: string;
}>();

const isAssetDetailsOpen = ref(true);
const isObjectDetailsOpen = ref(false);

const assetStore = useAssetStore();

watch(
  () => props.assetId,
  async () => {
    await assetStore.setActiveAsset(props.assetId);
  },
  { immediate: true }
);
</script>
<style scoped>
.asset-view-page {
  display: grid;
  height: 100vh;
}
.asset-view-page__viewer {
  grid-area: viewer;
}

.asset-view-page__asset-details {
  grid-area: asset-details;
}

.asset-view-page__object-details {
  grid-area: object-details;
}

@media (max-width: 639px) {
  .asset-view-page {
    grid-template-columns: 1fr;
    grid-template-rows: auto min-content min-content;
    grid-template-areas:
      "viewer"
      "asset-details"
      "object-details";
  }
  .asset-view-page.is-asset-details-open:not(.is-object-details-open) {
    grid-template-rows: auto 50vh min-content;
  }

  .asset-view-page.is-object-details-open:not(.is-asset-details-open) {
    grid-template-rows: auto min-content 50vh;
  }

  .asset-view-page.is-object-details-open.is-asset-details-open {
    grid-template-rows: 1fr 33vh 33vh;
  }
}

@media (min-width: 640px) {
  .asset-view-page {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr min-content;
    grid-template-areas:
      "viewer viewer"
      "asset-details object-details";
  }

  .asset-view-page.is-asset-details-open {
    grid-template-columns: minmax(0, 30rem) minmax(50%, 1fr);
    grid-template-areas:
      "asset-details viewer"
      "asset-details object-details";
  }

  .asset-view-page.is-object-details-open:not(.is-asset-details-open) {
    grid-template-columns: minmax(50%, 1fr) minmax(0, 30rem);
    grid-template-areas:
      "viewer object-details"
      "asset-details object-details";
  }

  .asset-view-page.is-asset-details-open.is-object-details-open {
    /* constrain the object details height */
    grid-template-rows: 1fr 20rem;
  }
}
</style>
