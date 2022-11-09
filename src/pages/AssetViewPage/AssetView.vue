<template>
  <div class="asset-view h-full relative">
    <ObjectViewer
      class="asset-view__object-viewer h-[75vh] md:h-auto md:absolute md:top-0 border-t-0 border-b-asset-view"
      :class="{
        'md:top-0 md:bottom-1/2 md:left-sm md:right-0 border-l-asset-view':
          isAssetDetailsOpen && isObjectDetailsOpen, // both open
        'md:top-0 md:bottom-16 md:left-sm md:right-0 border-l-asset-view':
          isAssetDetailsOpen && !isObjectDetailsOpen, // just asset details

        'md:top-0 md:bottom-16 md:left-0 md:right-sm border-r-asset-view':
          !isAssetDetailsOpen && isObjectDetailsOpen, // just object details
        'md:top-0 md:bottom-16 md:left-0 md:right-0':
          !isAssetDetailsOpen && !isObjectDetailsOpen, // neither open
      }"
      :fileHandlerId="assetStore.activeFileObjectId"
      @objectViewLoad="onObjectViewLoad"
    />
    <AssetDetailsDrawer
      class="asset-view__asset-panel md:absolute"
      :class="{
        'asset-view__asset-panel--open': isAssetDetailsOpen,
        'md:bottom-0 md:left-0 md:top-0 md:w-sm': isAssetDetailsOpen, // both open + asset details open
        'md:bottom-0 md:left-0 md:h-16 md:right-sm border-r-asset-view':
          !isAssetDetailsOpen && isObjectDetailsOpen, // just obj panel
        'md:bottom-0 md:left-0 md:h-16 md:w-1/2':
          !isAssetDetailsOpen && !isObjectDetailsOpen, //neither open
      }"
      :showToggle="permitDrawerToggle"
      :assetId="assetStore.activeAssetId"
      :isOpen="permitDrawerToggle ? isAssetDetailsOpen : true"
      @toggle="isAssetDetailsOpen = !isAssetDetailsOpen"
    >
      <MoreLikeThis v-if="assetId && isObjectViewLoaded" :assetId="assetId" />
    </AssetDetailsDrawer>
    <ObjectDetailsDrawer
      class="asset-view__details-panel md:absolute"
      :class="{
        'asset-view__details-panel--open': isObjectDetailsOpen,
        'border-l-asset-view': !isObjectDetailsOpen,
        'md:bottom-0 md:right-0 md:h-16 md:left-sm':
          !isObjectDetailsOpen && isAssetDetailsOpen, // just asset open
        'md:bottom-0 md:right-0 md:h-1/2 md:left-sm border-l-asset-view':
          isObjectDetailsOpen && isAssetDetailsOpen, // both panels open
        'md:bottom-0 md:right-0 md:top-0 md:w-sm':
          isObjectDetailsOpen && !isAssetDetailsOpen, // just object open
        'md:bottom-0 md:right-0 md:h-16 md:w-1/2':
          !isObjectDetailsOpen && !isAssetDetailsOpen, // neither panels open
      }"
      :showToggle="permitDrawerToggle"
      :objectId="assetStore.activeObjectId"
      :isOpen="permitDrawerToggle ? isObjectDetailsOpen : true"
      @toggle="isObjectDetailsOpen = !isObjectDetailsOpen"
    />
  </div>
</template>
<script setup lang="ts">
import { ref, defineAsyncComponent } from "vue";
import { useAssetStore } from "@/stores/assetStore";
import ObjectViewer from "@/components/ObjectViewer/ObjectViewer.vue";
import ObjectDetailsDrawer from "@/components/ObjectDetailsDrawer/ObjectDetailsDrawer.vue";
import AssetDetailsDrawer from "@/components/AssetDetailsDrawer/AssetDetailsDrawer.vue";
import { useMediaQuery } from "@vueuse/core";

const MoreLikeThis = defineAsyncComponent(
  () => import("@/components/MoreLikeThis/MoreLikeThis.vue")
);

defineProps<{
  assetId: string | null;
  objectId?: string | null;
}>();

const isAssetDetailsOpen = ref(true);
const isObjectDetailsOpen = ref(false);
const isObjectViewLoaded = ref(false);
const assetStore = useAssetStore();

function onObjectViewLoad() {
  isObjectViewLoaded.value = true;
}

const permitDrawerToggle = useMediaQuery("(min-width: 768px)");
</script>
<style scoped lang="postcss">
.border-r-asset-view {
  border-right: var(--app-panel-borderWidth) solid var(--app-panel-borderColor);
}
.border-l-asset-view {
  border-left: var(--app-panel-borderWidth) solid var(--app-panel-borderColor);
}
.border-b-asset-view {
  border-bottom: var(--app-panel-borderWidth) solid var(--app-panel-borderColor);
}
.border-t-asset-view {
  border-top: var(--app-panel-borderWidth) solid var(--app-panel-borderColor);
}

.border-x-asset-view {
  @apply border-r-asset-view border-l-asset-view;
}
</style>
