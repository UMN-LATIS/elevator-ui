<template>
  <div class="map-marker">
    <slot></slot>
  </div>
</template>
<script setup lang="ts">
import { watch, ref, unref } from "vue";
import { Marker } from "maplibre-gl";
import { inject, provide } from "vue";
import { MapInjectionKey, MarkerInjectionKey } from "@/constants/mapConstants";
import { LngLat } from "@/types";

interface Props {
  lng: number;
  lat: number;
  color?: string;
  draggable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  color: "#f43f5e",
  draggable: false,
});

interface Emits {
  (eventName: "drag", coords: LngLat);
}
const emit = defineEmits<Emits>();

const mapRef = inject(MapInjectionKey);
const marker = ref<Marker | null>(null);

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

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
provide(MarkerInjectionKey, marker);
// @ts-check
</script>
