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
import {
  ref,
  watch,
  provide,
  onMounted,
  onUnmounted,
  reactive,
  type Ref,
} from "vue";
import { useResizeObserver } from "@vueuse/core";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Map as MapLibreMap,
  Popup,
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

// map source and layer ids as constants (to help catch typos)
const MARKERS_SOURCE_ID = "markers";
const UNCLUSTERED_LAYER_ID = "unclustered-points";
const CLUSTER_LAYER_ID = "clusters";
const CLUSTER_COUNT_LAYER_ID = "cluster-count";

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

const markerPopupContainerRefs = new Map<string, Ref<HTMLElement | null>>();
function setMarkerPopupContainer(
  markerId: string,
  popupContainerRef: Ref<HTMLElement | null>
) {
  markerPopupContainerRefs.set(markerId, popupContainerRef);
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
        trackUserLocation: true,
      })
    )
    .addControl(new ScaleControl({ unit: "imperial" }))
    .on("click", (event: MapMouseEvent) => {
      if (!mapRef.value) {
        throw new Error("there was a click but no map");
      }

      emit("click", event, mapRef.value as unknown as MapLibreMap);
    })
    .on("click", CLUSTER_LAYER_ID, function (e) {
      // when a cluster is clicked, zoom in to it
      // to show the markers inside
      if (!mapRef.value) {
        throw new Error(
          "there was a click on the map, but no map. How is that even possible?"
        );
      }
      const map = mapRef.value;

      const features = map.queryRenderedFeatures(e.point, {
        layers: [CLUSTER_LAYER_ID],
      }) as GeoJSON.Feature<GeoJSON.Point>[];

      const clusterId = features[0].properties?.cluster_id;
      const source = map.getSource(MARKERS_SOURCE_ID) as GeoJSONSource;
      source?.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || zoom === null) return;

        const center = features[0].geometry?.coordinates as [number, number];

        map.easeTo({
          center,
          zoom,
        });
      });
    })
    .on("click", UNCLUSTERED_LAYER_ID, function (e: MapMouseEvent) {
      if (!mapRef.value) {
        throw new Error(
          "there was a click on the map, but no map. How is that even possible?"
        );
      }

      // eslint-disable-next-line
      // @ts-ignore - deep nested type conplaints
      const map = mapRef.value as MapLibreMap;

      const features = map.queryRenderedFeatures(e.point, {
        layers: [UNCLUSTERED_LAYER_ID],
      }) as GeoJSON.Feature<GeoJSON.Point>[];
      const point = features[0];

      const coordinates = point.geometry.coordinates.slice();

      // Ensure that if the map is zoomed out such that
      // multiple copies of the feature are visible, the
      // popup appears over the copy being pointed to.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      const markerId = point.properties?.id as string;
      const popupContainer = markerPopupContainerRefs.get(markerId)?.value;

      if (!popupContainer) {
        console.error(`no popup container for marker ${markerId}`);
        return;
      }

      new Popup()
        .setLngLat(coordinates as [number, number])
        .setDOMContent(popupContainer)
        .addTo(map);
    })
    .on("mouseenter", CLUSTER_LAYER_ID, function () {
      map.getCanvas().style.cursor = "pointer";
    })
    .on("mouseleave", CLUSTER_LAYER_ID, function () {
      map.getCanvas().style.cursor = "";
    })
    .on("mouseenter", UNCLUSTERED_LAYER_ID, function () {
      map.getCanvas().style.cursor = "pointer";
    })
    .on("mouseleave", UNCLUSTERED_LAYER_ID, function () {
      map.getCanvas().style.cursor = "";
    })
    .on("styledata", () => {
      // add the source and layers for the markers and clusters
      // do this here instead of in the `load` event because the style
      // may change after the map is loaded
      if (!mapRef.value) {
        throw new Error("cannot emit styledata event: no map");
      }

      const map = mapRef.value;

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
              "#D54FE1",
              10,
              "#754FE1",
              50,
              "#2C4DF6",
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
            "circle-stroke-width": 2,
            "circle-stroke-color": "#fff",
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
            "text-color": "white",
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
            "circle-color": "#F54D94",
            "circle-radius": 6,
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
  setMarkerPopupContainer,
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
