<template>
  <div class="maplibre-map">
    <div class="flex gap-4 justify-end items-center my-2">
      <button
        v-for="(style, key) in mapStyles"
        :key="key"
        class="text-sm uppercase"
        :class="{
          'font-bold border-b-2 border-b-neutral-900':
            key === activeMapStyleKey,
          'text-neutral-500': key !== activeMapStyleKey,
        }"
        @click="activeMapStyleKey = key"
      >
        {{ style.label }}
      </button>
    </div>
    <div ref="mapContainerRef" class="map-container" />
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, provide, type Ref, onMounted, onUnmounted } from "vue";
import { useResizeObserver } from "@vueuse/core";
import "maplibre-gl/dist/maplibre-gl.css";
import { Map as MapLibreMap, MapMouseEvent, Marker } from "maplibre-gl";
import { LngLat, BoundingBox, MapContext, AddMarkerArgs } from "@/types";
import { MapInjectionKey } from "@/constants/mapConstants";
import { withMapControls } from "./withMapControls";

const props = defineProps<{
  center: LngLat;
  bounds: BoundingBox;
  zoom: number;
  apiKey: string;
  esriSourceUrl?: string;
}>();

const emit = defineEmits<{
  (eventName: "click", mapMouseEvent: MapMouseEvent, mapboxMap: MapLibreMap);
  (eventName: "load", mapboxMap: MapLibreMap);
}>();

const mapContainerRef = ref<HTMLDivElement | null>(null);
const mapRef = ref<MapLibreMap | null>(null);

const mapStyles = {
  streets: {
    label: "Street",
    name: "ArcGIS:Navigation",
    type: "style",
  },
  satellite: {
    label: "Satellite",
    name: "ArcGIS:Imagery",
    type: "style",
  },
};

type MapStyle = keyof typeof mapStyles;
const activeMapStyleKey = ref<MapStyle>("streets");

const toArcGISUrl = (styleKey: string) => {
  const baseUrl = `https://basemaps-api.arcgis.com/arcgis/rest/services/styles`;
  const { name, type, url } = mapStyles[styleKey];
  return url || `${baseUrl}/${name}?type=${type}&token=${props.apiKey}`;
};

function updateStyle() {
  if (!mapRef.value) throw new Error("Cannot update style: no map");
  mapRef.value.setStyle(toArcGISUrl(activeMapStyleKey.value));
}

function updateBounds() {
  if (!props.bounds) return;
  if (!mapRef.value) {
    throw new Error("Cannot update bounds: no map");
  }

  mapRef.value.fitBounds(props.bounds, { padding: 64 });
}

watch(activeMapStyleKey, updateStyle);
watch([() => props.bounds, mapRef], updateBounds);

onMounted(() => {
  if (!mapContainerRef.value) {
    throw Error("Cannot create Map: container not defined:");
  }

  const map = withMapControls(
    new MapLibreMap({
      container: mapContainerRef.value,
      center: props.center ? [props.center.lng, props.center.lat] : [0, 0],
      style: toArcGISUrl(activeMapStyleKey.value),
      zoom: props.zoom,
    })
  );

  // added to avoid ts warning about deep nesting
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  mapRef.value = map as unknown as MapLibreMap;

  // add click handler
  mapRef.value.on("click", (event: MapMouseEvent) => {
    if (!mapRef.value) {
      throw new Error("there was a click but no map");
    }

    emit("click", event, mapRef.value as unknown as MapLibreMap);
  });

  mapRef.value.on("load", () => {
    if (!mapRef.value) {
      throw new Error("cannot emit load event: no map");
    }
    emit("load", mapRef.value as unknown as MapLibreMap);
  });

  useResizeObserver(mapContainerRef, () => {
    if (!mapRef.value) return;
    mapRef.value.resize();
  });
});

onUnmounted(() => {
  if (!mapRef.value) return;
  mapRef.value.remove();
  mapRef.value = null;
});

const markers = new Map<string, Marker>();
function createOrUpdateMarker({
  id,
  lng,
  lat,
  ...markerOptions
}: AddMarkerArgs) {
  // remove old marker if it exists
  const oldMarker = markers.get(id);
  if (oldMarker) {
    oldMarker.remove();
    markers.delete(id);
  }

  // create a new marker and add to the map
  const marker = new Marker(markerOptions).setLngLat([lng, lat]);

  // and also the markers Map (data structure)
  markers.set(id, marker);

  // add to the map if it exists
  const map = mapRef.value;
  if (map) {
    // some ugly type casting to avoid error about infinite recursion
    marker.addTo(map as unknown as MapLibreMap);
  }

  return marker;
}

function initMarkers() {
  const map = mapRef.value;
  if (!map) return;

  console.log("init markers", markers);
  markers.forEach((marker) => {
    // some ugly type casting to avoid error about infinite recursion
    marker.addTo(map as unknown as MapLibreMap);
  });
}

watch(mapRef, initMarkers);

function removeMarker(markerId: string) {
  const marker = markers.get(markerId);
  if (!marker) return;

  marker.remove();
  markers.delete(markerId);
}

provide<MapContext>(MapInjectionKey, {
  createOrUpdateMarker,
  removeMarker,
});
</script>

<style scoped>
.mapbox-map,
.map-container {
  width: 100%;
  height: 100%;
  min-height: 50vh;
  background: #ddd;
}
</style>
