<template>
  <div ref="popupContainerRef" class="map-popup">
    <slot></slot>
  </div>
</template>
<script setup lang="ts">
import { inject, ref, onMounted, onUnmounted, useTemplateRef } from "vue";
import { MarkerContext } from "@/types";
import { MarkerInjectionKey } from "@/constants/mapConstants";

const popupContainerRef = useTemplateRef("popupContainerRef");
const markerContext = inject<MarkerContext>(MarkerInjectionKey);

onMounted(() => {
  if (!markerContext) {
    throw new Error("Cannot add popup. Marker context is null");
  }
  markerContext.createPopup(popupContainerRef);
});

onUnmounted(() => {
  if (!markerContext) {
    throw new Error("Cannot remove popup. Marker context is null");
  }
  markerContext.removePopup();
});
</script>

<style>
.map-popup {
  font-size: 1rem;
}
.maplibregl-popup-close-button {
  padding: 0.5rem;
  font-size: 1.5rem;
}
</style>
