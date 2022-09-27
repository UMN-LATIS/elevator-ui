<template>
  <div class="maplibre-map">
    <div ref="mapContainerRef" class="map-container" />
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, provide } from "vue";
import { useResizeObserver } from "@vueuse/core";
import "maplibre-gl/dist/maplibre-gl.css";
import { Map as MapboxMap, MapMouseEvent } from "maplibre-gl";
import type { LngLat } from "@/types";
import { MapInjectionKey } from "@/constants";

const props = defineProps<{
  center: LngLat | null;
  zoom: number;
  apiKey: string;
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

  const basemapEnum = "ArcGIS:Topographic";

  mapRef.value = new MapboxMap({
    container: mapContainerRef.value,
    center: props.center ? [props.center.lng, props.center.lat] : undefined,
    style: `https://basemaps-api.arcgis.com/arcgis/rest/services/styles/${basemapEnum}?type=style&token=${props.apiKey}`,

    zoom: props.zoom,
  });

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
