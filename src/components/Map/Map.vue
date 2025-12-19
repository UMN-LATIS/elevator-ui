<template>
  <div class="maplibre-map">
    <div
      class="flex gap-4 sm:justify-end items-center mb-4"
      :class="labelsClass">
      <button
        v-for="(style, key) in mapStyles"
        :key="key"
        class="text-sm"
        :class="{
          'font-bold': key === activeMapStyleKey,
          'text-neutral-400': key !== activeMapStyleKey,
        }"
        @click="activeMapStyleKey = key">
        {{ style.label }}
      </button>
    </div>
    <div
      ref="mapContainerRef"
      class="map-container"
      :class="mapContainerClass" />
    <Skeleton v-if="!isLoaded" class="w-full h-[75vh]" />
    <div class="hidden">
      <!--
        hide any components (like popups) within the <Map>
        component to keep them from rendering on the page.

        For example, if a <MapMarker> has a <Popup> child,
        the <Popup> will be rendered here if it's not opened.
        which will cause it to appear on the page.

        `hidden` class will prevent this from happening.
      -->
      <slot />
    </div>
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
  useTemplateRef,
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
  MapOptions as MapLibreMapOptions,
} from "maplibre-gl";
import { LngLat, BoundingBox, MapContext, AddMarkerArgs } from "@/types";
import { MapInjectionKey } from "@/constants/mapConstants";
import Skeleton from "../Skeleton/Skeleton.vue";
import { Point } from "geojson";

const props = withDefaults(
  defineProps<{
    center: LngLat;
    bounds?: BoundingBox;
    zoom: number;
    apiKey: string;
    labelsClass?: string;
    mapStyle?: keyof typeof mapStyles;
    mapContainerClass?: string | string[] | Record<string, boolean>;
    fullscreenControl?: boolean;
    mapOptions?: Partial<MapLibreMapOptions>;
  }>(),
  {
    mapStyle: "light",
    labelsClass: "",
    bounds: undefined,
    mapContainerClass: "",
    fullscreenControl: true,
    mapOptions: () => ({}),
  }
);

const emit = defineEmits<{
  (eventName: "click", mapMouseEvent: MapMouseEvent, mapboxMap: MapLibreMap);
  (eventName: "load", mapboxMap: MapLibreMap);
}>();

const mapContainerRef = useTemplateRef("mapContainerRef");
const mapRef = ref<MapLibreMap | null>(null);
const markers = reactive(new Map<string, GeoJSON.Feature>());
const isLoaded = ref(false);
const previousZoom = ref<number>(props.zoom);

// see: https://developers.arcgis.com/documentation/mapping-apis-and-services/maps/services/basemap-layer-service/#default-styles

const mapStyles = {
  light: {
    label: "Light",
    name: "/styles/arcgis/light-gray",
  },
  dark: {
    label: "Dark",
    name: "/styles/arcgis/dark-gray",
  },
  satellite: {
    label: "Satellite",
    name: "/styles/arcgis/imagery",
  },
  streets: {
    label: "Street",
    name: "/styles/arcgis/navigation",
  },
};

const activeMapStyleKey = ref<keyof typeof mapStyles>(props.mapStyle);

// map source and layer ids as constants (to help catch typos)
const MARKERS_SOURCE_ID = "markers";
const UNCLUSTERED_LAYER_ID = "unclustered-points";
const CLUSTER_LAYER_ID = "clusters";
const CLUSTER_COUNT_LAYER_ID = "cluster-count";
const SPIDER_SOURCE_ID = "spider-points";
const SPIDER_LAYER_ID = "spider-layer";
const SPIDER_LEGS_SOURCE_ID = "spider-legs";
const SPIDER_LEG_LAYER_ID = "spider-leg-layer";

// Zoom threshold for switching between clusters and spiders
const SPIDER_ZOOM_THRESHOLD = 14;

const getArcGISUrl = (styleKey: string) => {
  const baseUrl = `https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2`;
  const { name, type, url } = mapStyles[styleKey];
  return url || `${baseUrl}${name}?token=${props.apiKey}`;
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

function addMarker({ id, lng, lat, ...properties }: AddMarkerArgs) {
  // Create a new GeoJSON feature for this point
  const newFeature: GeoJSON.Feature<Point> & { properties } = {
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

  return newFeature;
}

function removeMarker(markerId: string) {
  markers.delete(markerId);
}

const markerPopupContainerRefs = new Map<string, Ref<HTMLElement | null>>();
function setMarkerPopupContainer(
  markerId: string,
  popupContainerRef: Ref<HTMLElement | null>
) {
  markerPopupContainerRefs.set(markerId, popupContainerRef);
}

function removeMarkerPopup(markerId: string) {
  const popupContainerRef = markerPopupContainerRefs.get(markerId);
  if (popupContainerRef?.value) {
    popupContainerRef.value.innerHTML = "";
  }
  markerPopupContainerRefs.delete(markerId);
}

function getFeaturesWithOffset(markersMap: Map<string, GeoJSON.Feature>) {
  return Array.from(markersMap.values()) as GeoJSON.Feature<Point>[];
}

/**
 * Calculate positions for spider points in a circle around a center
 */
function calculateSpiderPositions(
  centerLng: number,
  centerLat: number,
  count: number,
  radiusDegrees = 0.0005
): [number, number][] {
  const positions: [number, number][] = [];
  const angleStep = (2 * Math.PI) / count;

  for (let i = 0; i < count; i++) {
    const angle = i * angleStep;
    const lng = centerLng + radiusDegrees * Math.cos(angle);
    const lat = centerLat + radiusDegrees * Math.sin(angle);
    positions.push([lng, lat]);
  }

  return positions;
}

/**
 * Generate spider data by querying clusters and positioning their children
 */
function generateSpiderData() {
  const map = mapRef.value;
  if (!map) return null;

  const source = map.getSource(MARKERS_SOURCE_ID) as GeoJSONSource;
  if (!source) return null;

  const spiderFeatures: GeoJSON.Feature<Point>[] = [];
  const spiderLegs: GeoJSON.Feature<GeoJSON.LineString>[] = [];

  // Query all rendered cluster features
  const clusterFeatures = map.querySourceFeatures(MARKERS_SOURCE_ID, {
    filter: ["has", "point_count"],
  }) as GeoJSON.Feature<Point>[];

  let processedClusters = 0;
  const totalClusters = clusterFeatures.length;

  // Process each cluster
  clusterFeatures.forEach((cluster) => {
    const clusterId = cluster.properties?.cluster_id;
    const clusterCoords = cluster.geometry.coordinates as [number, number];

    if (!clusterId) return;

    // Get the leaves (children) of this cluster
    source.getClusterLeaves(
      clusterId,
      100, // limit - get up to 100 children
      0, // offset
      (err, leaves) => {
        if (err || !leaves) {
          processedClusters++;
          return;
        }

        // Calculate spider positions for the leaves
        const spiderPositions = calculateSpiderPositions(
          clusterCoords[0],
          clusterCoords[1],
          leaves.length
        );

        // Create spider features for each leaf
        leaves.forEach((leaf, index) => {
          const spiderPos = spiderPositions[index];

          // Create the spidered point feature
          spiderFeatures.push({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: spiderPos,
            },
            properties: leaf.properties,
          });

          // Create a line from cluster center to spider point
          spiderLegs.push({
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [clusterCoords, spiderPos],
            },
            properties: {},
          });
        });

        processedClusters++;

        // Update spider layer when all clusters are processed
        if (processedClusters === totalClusters) {
          updateSpiderLayer(spiderFeatures, spiderLegs);
        }
      }
    );
  });

  // If there are no clusters, clear the spider layer
  if (totalClusters === 0) {
    updateSpiderLayer([], []);
  }
}

/**
 * Update the spider layer with new features
 */
function updateSpiderLayer(
  spiderFeatures: GeoJSON.Feature<Point>[],
  spiderLegs: GeoJSON.Feature<GeoJSON.LineString>[]
) {
  const map = mapRef.value;
  if (!map) return;

  const spiderSource = map.getSource(SPIDER_SOURCE_ID) as GeoJSONSource;
  if (spiderSource) {
    spiderSource.setData({
      type: "FeatureCollection",
      features: spiderFeatures,
    });
  }

  const spiderLegsSource = map.getSource(
    SPIDER_LEGS_SOURCE_ID
  ) as GeoJSONSource;
  if (spiderLegsSource) {
    spiderLegsSource.setData({
      type: "FeatureCollection",
      features: spiderLegs,
    });
  }
}

function renderMarkers() {
  const map = mapRef.value;
  if (!map) return;

  const source = map.getSource("markers") as GeoJSONSource;
  source?.setData({
    type: "FeatureCollection",
    features: getFeaturesWithOffset(markers),
  });

  // If we're at spider zoom level, regenerate spider data
  const currentZoom = map.getZoom();
  if (currentZoom >= SPIDER_ZOOM_THRESHOLD) {
    // Use setTimeout to ensure the source data is updated first
    setTimeout(() => {
      generateSpiderData();
    }, 0);
  }
}

watch(activeMapStyleKey, updateStyle);
watch([() => props.bounds, mapRef], updateBounds);

onMounted(() => {
  if (!mapContainerRef.value) {
    throw Error("Cannot create Map: container not defined:");
  }

  const map = new MapLibreMap({
    container: mapContainerRef.value,
    center: props.center ? [props.center.lng, props.center.lat] : [0, 0],
    style: getArcGISUrl(activeMapStyleKey.value),
    zoom: props.zoom,
    bounds: props.bounds,
    ...props.mapOptions,
  });

  if (props.fullscreenControl) {
    map.addControl(
      new FullscreenControl({
        container: document.querySelector("body") as HTMLBodyElement,
      })
    );
  }

  map
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
            features: getFeaturesWithOffset(markers),
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
          maxzoom: SPIDER_ZOOM_THRESHOLD,
          paint: {
            "circle-color": [
              "step",
              ["get", "point_count"],
              "#F54D94",
              5,
              "#F54D94",
            ],
            "circle-radius": [
              "step",
              ["get", "point_count"],
              20,
              10,
              30,
              100,
              40,
            ],
            "circle-stroke-width": 8,
            "circle-stroke-color": "rgba(245, 77, 138, 0.25)",
          },
        });
      }

      // add layer for cluster count text
      if (!map.getLayer(CLUSTER_COUNT_LAYER_ID)) {
        map.addLayer({
          id: CLUSTER_COUNT_LAYER_ID,
          type: "symbol",
          source: MARKERS_SOURCE_ID,
          maxzoom: SPIDER_ZOOM_THRESHOLD,
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
            "circle-radius": 8,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#fff",
          },
        });
      }

      // Add spider source and layer for high zoom levels
      if (!map.getSource(SPIDER_SOURCE_ID)) {
        map.addSource(SPIDER_SOURCE_ID, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });
      }

      // Add spider legs source
      if (!map.getSource(SPIDER_LEGS_SOURCE_ID)) {
        map.addSource(SPIDER_LEGS_SOURCE_ID, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });
      }

      // Add spider leg lines (connecting cluster center to spider points)
      // Add this layer first so it renders below the spider points
      if (!map.getLayer(SPIDER_LEG_LAYER_ID)) {
        map.addLayer({
          id: SPIDER_LEG_LAYER_ID,
          type: "line",
          source: SPIDER_LEGS_SOURCE_ID,
          minzoom: SPIDER_ZOOM_THRESHOLD,
          paint: {
            "line-color": "#999",
            "line-width": 1,
            "line-dasharray": [2, 2],
          },
        });
      }

      // Add spider layer (visible only at high zoom)
      if (!map.getLayer(SPIDER_LAYER_ID)) {
        map.addLayer({
          id: SPIDER_LAYER_ID,
          type: "circle",
          source: SPIDER_SOURCE_ID,
          minzoom: SPIDER_ZOOM_THRESHOLD,
          paint: {
            "circle-color": "#F54D94",
            "circle-radius": 8,
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
      isLoaded.value = true;
      emit("load", mapRef.value as unknown as MapLibreMap);
    })
    .on("zoom", () => {
      if (!mapRef.value) return;

      const currentZoom = mapRef.value.getZoom();

      // Crossing into spider territory (zooming in past threshold)
      if (
        currentZoom >= SPIDER_ZOOM_THRESHOLD &&
        previousZoom.value < SPIDER_ZOOM_THRESHOLD
      ) {
        generateSpiderData();
      }

      // Crossing out of spider territory (zooming out below threshold)
      if (
        currentZoom < SPIDER_ZOOM_THRESHOLD &&
        previousZoom.value >= SPIDER_ZOOM_THRESHOLD
      ) {
        // Clear spider layer
        updateSpiderLayer([], []);
      }

      previousZoom.value = currentZoom;
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
  addMarker,
  removeMarker,
  setMarkerPopupContainer,
  removeMarkerPopup,
  renderMarkers,
});
</script>

<style scoped>
.mapbox-map,
.map-container {
  width: 100%;
  height: 100%;
  min-height: 25rem;
  background: #ddd;
}
</style>
