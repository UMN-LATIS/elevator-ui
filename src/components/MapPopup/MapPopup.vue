<template>
  <div ref="popupRef" class="map-popup">
    <slot></slot>
  </div>
</template>
<script setup lang="ts">
import { inject, watch, ref } from "vue";
import { Popup } from "maplibre-gl";
import { MarkerInjectionKey } from "@/constants/mapConstants";

const markerRef = inject(MarkerInjectionKey);
const popupRef = ref(null);

// use ref to get the content of the slot
// and then put it in the popup using setDOMContent
watch([markerRef, popupRef], () => {
  if (!markerRef || !markerRef.value || !popupRef.value) return;
  const popup = new Popup().setDOMContent(popupRef.value);
  markerRef.value.setPopup(popup);
});
</script>

<style>
/* the actual popup container */
.map-popup {
  font-size: 0.8rem;
  font-family: Poppins, sans-serif;
}
.map-popup h1,
.map-popup h2,
.map-popup h3 {
  font-size: 1rem;
  text-transform: uppercase;
  margin: 0;
  font-weight: 600;
}
.map-popup p {
  margin: 0;
}
.mapboxgl-popup-content {
  padding: 1.25rem 1rem 1rem;
  background: hsla(0, 0%, 100%, 0.75);
}
.mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip {
  border-top-color: hsla(0, 0%, 100%, 0.75);
}

.mapboxgl-popup-anchor-top .mapboxgl-popup-tip {
  border-bottom-color: hsla(0, 0%, 100%, 0.75);
}

.mapboxgl-popup-anchor-left .mapboxgl-popup-tip {
  border-right-color: hsla(0, 0%, 100%, 0.75);
}

.mapboxgl-popup-anchor-right .mapboxgl-popup-tip {
  border-left-color: hsla(0, 0%, 100%, 0.75);
}

.mapboxgl-popup {
  /* TODO: make this happen with autoprefixer */
  -webkit-backdrop-filter: blur(0.5rem);
  backdrop-filter: blur(0.25rem);
}
</style>
