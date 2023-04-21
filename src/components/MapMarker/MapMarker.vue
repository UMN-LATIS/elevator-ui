<template>
  <div class="map-marker">
    <slot></slot>
  </div>
</template>
<script setup lang="ts">
import { watchEffect, type Ref, onMounted, onUnmounted } from "vue";
import { Marker, Popup } from "maplibre-gl";
import { inject, provide } from "vue";
import { MapInjectionKey, MarkerInjectionKey } from "@/constants/mapConstants";
import { MapContext, MarkerContext } from "@/types";

const props = withDefaults(
  defineProps<{
    id: string;
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

const mapContext = inject<MapContext>(MapInjectionKey);
let marker: Marker | null = null;

onMounted(() => {
  if (!mapContext) {
    throw new Error(
      `Cannot add marker ${props.id} for [${props.lng}, ${props.lat}]. Map context is null.`
    );
  }

  marker = mapContext.createOrUpdateMarker({
    id: props.id,
    lng: props.lng,
    lat: props.lat,
    color: props.color,
  });
});

onUnmounted(() => {
  if (!mapContext) {
    throw new Error(
      `Cannot remove marker ${props.id} for [${props.lng}, ${props.lat}]. Map context is null.`
    );
  }

  mapContext.removeMarker(props.id);
});

let popup: Popup | null = null;

function createPopup(popupContainerRef: Ref<HTMLElement | null>) {
  if (!popupContainerRef.value) {
    throw new Error("Popup container ref is null");
  }

  popup = new Popup().setDOMContent(popupContainerRef.value);

  // watch the marker ref, and add the popup to it
  const stopWatching = watchEffect(() => {
    if (!marker) return;
    marker.setPopup(popup);
    stopWatching();
  });

  return popup;
}

function removePopup() {
  if (!popup) return;
  popup.remove();
  popup = null;
}

provide<MarkerContext>(MarkerInjectionKey, {
  createPopup,
  removePopup,
});

// const mapRef = inject(MapInjectionKey);
// const marker = ref<Marker | null>(null);

// watch(
//   [mapRef, () => props],
//   () => {
//     const map = unref(mapRef);

//     // if no map yet, nothing to do
//     if (!map) {
//       console.log("Cannot add marker yet. No map.");
//       return;
//     }

//     // remove old marker if it exists
//     const oldMarker = unref(marker);
//     if (oldMarker) oldMarker.remove();

//     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//     // @ts-ignore
//     marker.value = new Marker({
//       color: props.color,
//       draggable: props.draggable,
//     })
//       .setLngLat([props.lng, props.lat])
//       .addTo(map)
//       .on("dragend", () => {
//         const lngLat = marker.value?.getLngLat();
//         if (!lngLat) return;
//         emit("drag", {
//           lng: lngLat.lng,
//           lat: lngLat.lat,
//         });
//       });
//   },
//   { immediate: true }
// );
</script>
