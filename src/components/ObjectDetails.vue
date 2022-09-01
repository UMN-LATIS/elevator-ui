<template>
  <div class="object-details">
    <h1>Object Details</h1>
    <pre>{{ objectAsset }}</pre>
  </div>
</template>
<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { useAssetStore } from "@/stores/newAssetStore";
import { Asset } from "@/types";

const props = defineProps<{
  objectId: string;
}>();

const objectAsset = ref<Asset | null>(null);
const assetStore = useAssetStore();

function getObjectAsset(objectId: string) {
  if (!objectId) return null;
  return assetStore.fetchAsset(props.objectId);
}

watchEffect(async () => {
  objectAsset.value = await getObjectAsset(props.objectId);
});
</script>

<style scoped></style>
