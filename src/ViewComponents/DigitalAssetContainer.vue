<template>
  <iframe
    v-if="store.fileObjectId"
    :src="getEmbedLink(store.fileObjectId, store.objectId ?? null)"
    :style="{ width: '100%', height: '100%' }"
    frameBorder="0"
    allowfullscreen="true"
  ></iframe>
</template>

<script setup lang="ts">
import { useAssetStore } from "@/stores/assetStore";
import { getEmbedLink } from "@/Helpers/displayUtils";

const store = useAssetStore();
</script>
