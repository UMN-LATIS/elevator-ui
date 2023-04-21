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
import { ref, watch, provide, onMounted, onUnmounted, reactive } from "vue";
import { useResizeObserver } from "@vueuse/core";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Map as MapLibreMap,
  MapMouseEvent,
  GeoJSONSource,
  FullscreenControl,
  GeolocateControl,
  ScaleControl,
} from "maplibre-gl";
import { LngLat, BoundingBox, MapContext, AddMarkerArgs } from "@/types";
import { MapInjectionKey } from "@/constants/mapConstants";

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
const markers = reactive(new Map<string, GeoJSON.Feature>());

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

const activeMapStyleKey = ref<keyof typeof mapStyles>("streets");

const getArcGISUrl = (styleKey: string) => {
  const baseUrl = `https://basemaps-api.arcgis.com/arcgis/rest/services/styles`;
  const { name, type, url } = mapStyles[styleKey];
  return url || `${baseUrl}/${name}?type=${type}&token=${props.apiKey}`;
};

function updateStyle() {
  if (!mapRef.value) throw new Error("Cannot update style: no map");
  mapRef.value.setStyle(getArcGISUrl(activeMapStyleKey.value));
}

function updateBounds() {
  if (!props.bounds) return;
  if (!mapRef.value) {
    throw new Error("Cannot update bounds: no map");
  }

  mapRef.value.fitBounds(props.bounds, { padding: 64 });
}

function createOrUpdateMarker({ id, lng, lat, ...properties }: AddMarkerArgs) {
  // Create a new GeoJSON feature
  const newFeature: GeoJSON.Feature = {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [lng, lat],
    },
    properties: {
      ...properties,
      id,
    },
  };

  markers.set(id, newFeature);
  renderMarkers();

  return newFeature;
}

function removeMarker(markerId: string) {
  markers.delete(markerId);
  renderMarkers();
}

function renderMarkers() {
  const map = mapRef.value;
  if (!map) return;

  const source = map.getSource("markers") as GeoJSONSource;
  source?.setData({
    type: "FeatureCollection",
    features: Array.from(markers.values()),
  });
}

watch(activeMapStyleKey, updateStyle);
watch([() => props.bounds, mapRef], updateBounds);
watch([mapRef, markers, activeMapStyleKey], renderMarkers);

onMounted(() => {
  if (!mapContainerRef.value) {
    throw Error("Cannot create Map: container not defined:");
  }

  const map = new MapLibreMap({
    container: mapContainerRef.value,
    center: props.center ? [props.center.lng, props.center.lat] : [0, 0],
    style: getArcGISUrl(activeMapStyleKey.value),
    zoom: props.zoom,
  })
    .addControl(
      new FullscreenControl({
        container: document.querySelector("body") as HTMLBodyElement,
      })
    )
    .addControl(
      new GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        // When active the map will receive updates to the device's location as it changes.
        trackUserLocation: true,
        // Draw an arrow next to the location dot to indicate which direction the device is heading.
        // showUserHeading: true,
      })
    )
    .addControl(new ScaleControl({ unit: "imperial" }))
    .on("click", (event: MapMouseEvent) => {
      if (!mapRef.value) {
        throw new Error("there was a click but no map");
      }

      emit("click", event, mapRef.value as unknown as MapLibreMap);
    })
    .on("styledata", () => {
      // add the source and layers for the markers and clusters
      // do this here instead of in the `load` event because the style
      // may change after the map is loaded
      if (!mapRef.value) {
        throw new Error("cannot emit styledata event: no map");
      }

      const map = mapRef.value;

      // ids as constants to help catch typos
      const MARKERS_SOURCE_ID = "markers";
      const UNCLUSTERED_LAYER_ID = "unclustered-points";
      const CLUSTER_LAYER_ID = "clusters";
      const CLUSTER_COUNT_LAYER_ID = "cluster-count";

      // Add a new GeoJSON source with clustering enabled
      if (!map.getSource(MARKERS_SOURCE_ID)) {
        map.addSource(MARKERS_SOURCE_ID, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: Array.from(markers.values()),
          },
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        });
      }

      // Add a layer for clustered points
      if (!map.getLayer(CLUSTER_LAYER_ID)) {
        map.addLayer({
          id: CLUSTER_LAYER_ID,
          type: "circle",
          source: MARKERS_SOURCE_ID,
          filter: ["has", "point_count"],
          paint: {
            "circle-color": [
              "step",
              ["get", "point_count"],
              "#51bbd6",
              10,
              "#f1f075",
              100,
              "#f28cb1",
            ],
            "circle-radius": [
              "step",
              ["get", "point_count"],
              20,
              100,
              30,
              750,
              40,
            ],
          },
        });
      }

      // add layer for cluster count text
      if (!map.getLayer(CLUSTER_COUNT_LAYER_ID)) {
        map.addLayer({
          id: CLUSTER_COUNT_LAYER_ID,
          type: "symbol",
          source: MARKERS_SOURCE_ID,
          layout: {
            "text-font": ["Arial Bold"],
            "text-field": ["get", "point_count"],
            "text-offset": [0, 0.1], // move the label vertically downwards slightly to improve centering
          },
          paint: {
            "text-color": "black",
          },
        });
      }

      // Add a layer for individual points
      if (!map.getLayer(UNCLUSTERED_LAYER_ID)) {
        map.addLayer({
          id: UNCLUSTERED_LAYER_ID,
          type: "circle",
          source: "markers",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": "#f43f5e",
            "circle-radius": 10,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#fff",
          },
        });
      }
    })
    .on("load", () => {
      if (!mapRef.value) {
        throw new Error("cannot emit load event: no map");
      }
      emit("load", mapRef.value as unknown as MapLibreMap);
    });

  // added to avoid ts warning about deep nesting
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  mapRef.value = map;

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
