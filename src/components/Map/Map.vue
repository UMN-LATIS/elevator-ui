<template>
  <div class="maplibre-map">
    <div ref="mapContainerRef" class="map-container" />
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, provide, type Ref } from "vue";
import { useResizeObserver } from "@vueuse/core";
import "maplibre-gl/dist/maplibre-gl.css";
import { Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";
import type { LngLat } from "@/types";
import { MapInjectionKey } from "@/constants";

const props = defineProps<{
  center: LngLat | null;
  zoom: number;
  apiKey: string;
}>();

const emit = defineEmits<{
  (eventName: "click", mapMouseEvent: MapMouseEvent, mapboxMap: MapLibreMap);
  (eventName: "load", mapboxMap: MapLibreMap);
}>();

const mapContainerRef = ref<HTMLDivElement | null>(null);
const mapRef = ref<MapLibreMap | null>(null);

onMounted(() => {
  if (!mapContainerRef.value) {
    throw Error("Cannot create Map: container not defined:");
  }

  const basemapEnum = "ArcGIS:Topographic";

  // @ts-ignore
  mapRef.value = new MapLibreMap({
    container: mapContainerRef.value,
    center: props.center ? [props.center.lng, props.center.lat] : undefined,
    style: `https://basemaps-api.arcgis.com/arcgis/rest/services/styles/${basemapEnum}?type=style&token=${props.apiKey}`,

    zoom: props.zoom,
  });
  //@ts-check

  // add click handler
  mapRef.value.on("click", (event: MapMouseEvent) => {
    if (!mapRef.value) {
      // this shouldn't happen
      throw new Error("there was a click but no map");
    }

    emit("click", event, mapRef.value as MapLibreMap);
  });

  mapRef.value.on("load", () => {
    if (!mapRef.value) {
      throw new Error("cannot emit load event: no mapRef");
    }
    emit("load", mapRef.value as MapLibreMap);
  });

  useResizeObserver(mapContainerRef, () => {
    if (!mapRef.value) return;
    mapRef.value.resize();
  });
});

// ignore because of error about type instantiation being excessively deep
// and possibly infinite
// @ts-ignore
provide(MapInjectionKey, mapRef as Ref<MapLibreMap | null>);
// @ts-check
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
