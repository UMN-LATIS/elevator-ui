<template>
  <div class="embedded-launch-test-page">
    <AssetViewPage :assetId="assetId" :objectId="objectId" />
  </div>
</template>
<script setup lang="ts">
import AssetViewPage from "../AssetViewPage/AssetViewPage.vue";
withDefaults(
  defineProps<{
    assetId: string;
    objectId?: string | null;
  }>(),
  { objectId: null }
);

// when a page is launched from canvas the `embeddedPlugin` key
// will be set to `Canvas` in sessionStorage.
window.sessionStorage.setItem("embeddedPlugin", "WordPress");
</script>
<style scoped></style>
