<template>
  <div
    class="asset-view-page"
    :class="{
      'is-asset-details-open': isAssetDetailsOpen,
      'is-object-details-open': isObjectDetailsOpen,
    }"
  >
    <ObjectViewer
      v-if="assetStore.activeObjectId"
      class="asset-view-page__viewer"
      :objectId="assetStore.activeObjectId"
    />
    <AssetDetails
      v-if="assetStore.activeAssetId"
      class="asset-view-page__asset-details"
      :assetId="assetStore.activeAssetId"
      :isOpen="isAssetDetailsOpen"
      @toggle="isAssetDetailsOpen = !isAssetDetailsOpen"
    />
    <ObjectDetails
      v-if="assetStore.activeObjectId"
      class="asset-viewpage__object-details"
      :objectId="assetStore.activeObjectId"
      :isOpen="isObjectDetailsOpen"
      @toggle="isObjectDetailsOpen = !isObjectDetailsOpen"
    />
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAssetStore } from "@/stores/newAssetStore";
import ObjectViewer from "@/components/ObjectViewer.vue";
import ObjectDetails from "@/components/ObjectDetails.vue";
import AssetDetails from "@/components/AssetDetails.vue";

const props = defineProps<{
  assetId: string;
}>();

const isAssetDetailsOpen = ref(false);
const isObjectDetailsOpen = ref(false);

const assetStore = useAssetStore();

onMounted(async () => {
  await assetStore.setActiveAsset(props.assetId);
});
</script>
<style scoped>
@media (min-width: 640px) {
  .asset-view-page {
    display: grid;
    height: 100vh;
    grid-template-columns: 1fr 2fr;
    grid-template-rows: 1fr min-content;
    grid-template-areas:
      "viewer viewer"
      "asset-details object-details";
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

  .asset-view-page.is-asset-details-open {
    grid-template-areas:
      "asset-details viewer"
      "asset-details object-details";
  }

  .asset-view-page.is-object-details-open:not(.is-asset-details-open) {
    grid-template-areas:
      "viewer object-details"
      "asset-details object-details";
  }

  .asset-view-page.is-asset-details-open.is-object-details-open {
    /* constrain the object details height */
    grid-template-rows: 1fr 50vh;
  }
}
</style>
