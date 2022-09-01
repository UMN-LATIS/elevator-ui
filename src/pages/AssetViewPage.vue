<template>
  <div class="asset-view-page">
    <ObjectViewer
      v-if="assetStore.activeObjectId"
      :objectId="assetStore.activeObjectId"
    />
    <div v-else>Object Viewer Skeleton</div>

    <ObjectDetails
      v-if="assetStore.activeObjectId"
      :objectId="assetStore.activeObjectId"
    />
    <div v-else>Object Details Skeleton</div>

    <AssetDetails
      v-if="assetStore.activeAssetId"
      :assetId="assetStore.activeAssetId"
    />
  </div>
</template>
<script setup lang="ts">
import { onMounted } from "vue";
import { useAssetStore } from "@/stores/newAssetStore";
import ObjectViewer from "@/components/ObjectViewer.vue";
import ObjectDetails from "@/components/ObjectDetails.vue";
import AssetDetails from "@/components/AssetDetails.vue";

const props = defineProps<{
  assetId: string;
}>();

const assetStore = useAssetStore();

onMounted(async () => {
  await assetStore.setActiveAsset(props.assetId);
});
</script>
<style scoped></style>
