<template>
  <div class="asset-details">
    <h1>Asset Details</h1>
    <pre> {{ asset }}</pre>
  </div>
</template>
<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { useAssetStore } from "@/stores/newAssetStore";
import { Asset } from "@/types";

const props = defineProps<{
  assetId: string;
}>();

const asset = ref<Asset | null>(null);
const assetStore = useAssetStore();

function getAsset(objectId: string) {
  if (!objectId) return null;
  return assetStore.fetchAsset(props.assetId);
}

watchEffect(async () => {
  asset.value = await getAsset(props.assetId);
});
</script>
<style scoped></style>
