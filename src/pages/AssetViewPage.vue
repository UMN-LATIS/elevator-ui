<template>
  <div class="asset-view-page">
    <ObjectViewer
      v-if="assetStore.activeObjectId"
      :objectId="assetStore.activeObjectId"
    />
    <ObjectDetails :objectId="assetStore.activeObjectId" />
    <AssetDetails :assetId="assetStore.activeAssetId" />
  </div>
</template>
<script setup lang="ts">
import { onMounted } from "vue";
import { useAssetStore } from "@/stores/newAssetStore";
import ObjectViewer from "@/components/ObjectViewer.vue";

const props = defineProps<{
  assetId: string;
}>();

const assetStore = useAssetStore();

onMounted(async () => {
  await assetStore.setActiveAsset(props.assetId);
});
</script>
<style scoped></style>
