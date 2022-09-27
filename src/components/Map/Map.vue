<template>
  <div class="mapbox-map">
    <div ref="mapContainerRef" class="map-container" />
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, provide } from "vue";
import { useResizeObserver } from "@vueuse/core";
import "mapbox-gl/dist/mapbox-gl.css";
import { Map as MapboxMap, MapMouseEvent } from "mapbox-gl";
import { withEsriSource } from "./withEsriSource";
import { pipe } from "ramda/es/pipe";

import type { LngLat } from "@/types";
import { MapInjectionKey } from "@/constants";
import { withMapControls } from "./withMapControls";

const props = defineProps<{
  center: LngLat | null;
  zoom: number;
  accessToken: string;
}>();

const emit = defineEmits<{
  (eventName: "click", mapMouseEvent: MapMouseEvent, mapboxMap: MapboxMap);
  (eventName: "load", mapboxMap: MapboxMap);
}>();

const mapContainerRef = ref<HTMLDivElement>();
const mapRef = ref<MapboxMap | null>(null);

onMounted(() => {
  if (!mapContainerRef.value) {
    throw Error(
      "Cannot create Map: container not defined:",
      mapContainerRef.value
    );
  }

  const withMapEnhancements = pipe(withEsriSource(), withMapControls());

  mapRef.value = withMapEnhancements(
    new MapboxMap({
      container: mapContainerRef.value,
      center: props.center ? [props.center.lng, props.center.lat] : undefined,
      zoom: props.zoom,
      accessToken: props.accessToken,
    })
  );

  // add click handler
  mapRef.value.on("click", (event: MapMouseEvent) => {
    if (!mapRef.value) {
      // this shouldn't happen
      throw new Error("there was a click but no map");
    }

    emit("click", event, mapRef.value);
  });

  mapRef.value.on("load", () => {
    if (!mapRef.value) {
      throw new Error("cannot emit load event: no mapRef");
    }
    emit("load", mapRef.value);
  });

  useResizeObserver(mapContainerRef, () => {
    if (!mapRef.value) return;
    mapRef.value.resize();
  });
});

provide(MapInjectionKey, mapRef);
</script>

<style scoped>
.mapbox-map,
.map-container {
  width: 100%;
  height: 100%;
  min-height: 20rem;
  background: #ddd;
}
</style>
