<template>
  <div class="map-marker">
    <slot></slot>
  </div>
</template>
<script setup lang="ts">
import { watch, ref, unref, type Ref } from "vue";
import { Marker, Popup } from "maplibre-gl";
import { inject, provide } from "vue";
import { MapInjectionKey, MarkerInjectionKey } from "@/constants/mapConstants";
import { LngLat, MarkerContext } from "@/types";

const props = withDefaults(
  defineProps<{
    lng: number;
    lat: number;
    color?: string;
    draggable?: boolean;
  }>(),
  {
    color: "#f43f5e",
    draggable: false,
  }
);

interface Emits {
  (eventName: "drag", coords: LngLat);
}
const emit = defineEmits<Emits>();

const mapRef = inject(MapInjectionKey);
const marker = ref<Marker | null>(null);
const popup = ref<Popup | null>(null);

watch(
  [mapRef, () => props],
  () => {
    const map = unref(mapRef);

    // if no map yet, nothing to do
    if (!map) {
      console.log("Cannot add marker yet. No map.");
      return;
    }

    // remove old marker if it exists
    const oldMarker = unref(marker);
    if (oldMarker) oldMarker.remove();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    marker.value = new Marker({
      color: props.color,
      draggable: props.draggable,
    })
      .setLngLat([props.lng, props.lat])
      .addTo(map)
      .on("dragend", () => {
        const lngLat = marker.value?.getLngLat();
        if (!lngLat) return;
        emit("drag", {
          lng: lngLat.lng,
          lat: lngLat.lat,
        });
      });
  },
  { immediate: true }
);

function addPopup(popupContainerRef: Ref<HTMLElement | null>) {
  if (!popupContainerRef.value) {
    throw new Error("Popup container ref is null");
  }

  const popup = new Popup().setDOMContent(popupContainerRef.value);

  // watch the marker ref, and add the popup to it
  const stopWatching = watch(marker, (markerInstance) => {
    if (!markerInstance) return;
    markerInstance.setPopup(popup);
    // if we're successful, stop watching
    stopWatching();
  });

  return () => popup.remove();
}

provide<MarkerContext>(MarkerInjectionKey, {
  addPopup,
});
</script>
