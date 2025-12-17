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
import getBoundingBox from "./getBoundingBox";

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

// Track which location groups are spidered out
// Key is "lng,lat" string, value is true if spidered
const spideredLocations = reactive(new Map<string, boolean>());

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
const SPIDER_LINES_SOURCE_ID = "spider-lines";
const SPIDER_LINES_LAYER_ID = "spider-lines-layer";

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

function getOtherMarkersWithSameCoords({
  id,
  lng,
  lat,
}: {
  id: string;
  lng: number;
  lat: number;
}) {
  const allMarkers = Array.from(markers.values()) as GeoJSON.Feature<Point>[];

  // Since coords can be slightly different
  // yet still overlap on the map, we check
  // check that the difference between this coord
  // and a given marker is below a certain threshold
  // to determine if they are in the "same" spot.
  return allMarkers.filter((marker) => {
    if (marker.properties?.id === id) return false;

    const lngDiff = Math.abs(marker.geometry.coordinates[0] - lng);
    const latDiff = Math.abs(marker.geometry.coordinates[1] - lat);

    return lngDiff < 0.0001 && latDiff < 0.0001;
  });
}

// Generate a key for a location (for tracking spidered groups)
function getLocationKey(lng: number, lat: number): string {
  // Round to avoid floating point precision issues
  return `${lng.toFixed(4)},${lat.toFixed(4)}`;
}

// Calculate circular offset for marker spider layout
function calculateSpiderOffset(
  index: number,
  totalMarkers: number
): [number, number] {
  if (totalMarkers <= 1) {
    return [0, 0];
  }

  const angleStep = (2 * Math.PI) / totalMarkers;
  const angle = angleStep * index;
  // Use offset of 0.001 degrees (~111 meters)
  const radius = 0.001;

  return [radius * Math.cos(angle), radius * Math.sin(angle)];
}

function addMarker({ id, lng, lat, ...properties }: AddMarkerArgs) {
  const locationKey = getLocationKey(lng, lat);

  // Create a new GeoJSON feature for this point
  // totalMarkersAtLocation and markerIndex will be calculated dynamically
  const newFeature: GeoJSON.Feature<Point> & { properties } = {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [lng, lat],
    },
    properties: {
      ...properties,
      id,
      locationKey,
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
  const features = Array.from(markersMap.values()) as GeoJSON.Feature<Point>[];

  // First, count how many markers are at each location
  const locationCounts = new Map<string, number>();
  const locationIndices = new Map<string, number>();
  
  features.forEach((feature) => {
    const locationKey = feature.properties?.locationKey as string;
    locationCounts.set(locationKey, (locationCounts.get(locationKey) || 0) + 1);
  });

  // Apply offset to markers only if their location is spidered out
  const featuresWithOffset = features.map((feature) => {
    const locationKey = feature.properties?.locationKey as string;
    const isSpideredOut = spideredLocations.get(locationKey) || false;
    const totalMarkersAtLocation = locationCounts.get(locationKey) || 1;
    
    // Get and increment the index for this location
    const markerIndex = locationIndices.get(locationKey) || 0;
    locationIndices.set(locationKey, markerIndex + 1);
    
    // Only the first marker at a location shows the count badge
    const isFirstAtLocation = markerIndex === 0;
    
    let offset: [number, number] = [0, 0];
    
    if (isSpideredOut) {
      // Calculate spider offset for this marker
      offset = calculateSpiderOffset(markerIndex, totalMarkersAtLocation);
    }
    
    return {
      ...feature,
      properties: {
        ...feature.properties,
        offset,
        isSpideredOut,
        totalMarkersAtLocation, // Update with correct count
        markerIndex, // Update with correct index
        isFirstAtLocation, // Mark if this is the representative marker
      },
      geometry: {
        ...feature.geometry,
        coordinates: [
          feature.geometry.coordinates[0] + offset[0],
          feature.geometry.coordinates[1] + offset[1],
        ],
      },
    };
  });

  return featuresWithOffset;
}

function getSpiderLineFeatures(markersMap: Map<string, GeoJSON.Feature>): GeoJSON.Feature[] {
  const features = Array.from(markersMap.values()) as GeoJSON.Feature<Point>[];
  const lines: GeoJSON.Feature[] = [];
  
  // Group markers by location
  const locationGroups = new Map<string, GeoJSON.Feature<Point>[]>();
  features.forEach((feature) => {
    const locationKey = feature.properties?.locationKey as string;
    if (!locationGroups.has(locationKey)) {
      locationGroups.set(locationKey, []);
    }
    locationGroups.get(locationKey)!.push(feature);
  });
  
  // For each spidered-out location, create lines from center to each marker
  locationGroups.forEach((markersAtLocation, locationKey) => {
    const isSpideredOut = spideredLocations.get(locationKey) || false;
    
    if (isSpideredOut && markersAtLocation.length > 1) {
      const baseLng = markersAtLocation[0].geometry.coordinates[0];
      const baseLat = markersAtLocation[0].geometry.coordinates[1];
      
      markersAtLocation.forEach((_, index) => {
        const offset = calculateSpiderOffset(index, markersAtLocation.length);
        const endLng = baseLng + offset[0];
        const endLat = baseLat + offset[1];
        
        // Create a LineString from center to the spidered marker
        lines.push({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [baseLng, baseLat], // start at center
              [endLng, endLat],   // end at marker position
            ],
          },
          properties: {
            locationKey,
          },
        });
      });
    }
  });
  
  return lines;
}

function renderMarkers() {
  const map = mapRef.value;
  if (!map) return;

  const source = map.getSource("markers") as GeoJSONSource;
  source?.setData({
    type: "FeatureCollection",
    features: getFeaturesWithOffset(markers),
  });
  
  // Update spider lines
  const spiderLinesSource = map.getSource(SPIDER_LINES_SOURCE_ID) as GeoJSONSource;
  spiderLinesSource?.setData({
    type: "FeatureCollection",
    features: getSpiderLineFeatures(markers),
  });
}

function toggleSpiderLocation(locationKey: string) {
  const isCurrentlySpideredOut = spideredLocations.get(locationKey) || false;
  const willBeSpideredOut = !isCurrentlySpideredOut;
  
  spideredLocations.set(locationKey, willBeSpideredOut);
  renderMarkers();
  
  // If spidering out, zoom to show all the expanded markers
  if (willBeSpideredOut && mapRef.value) {
    // Get all markers at this location
    const markersAtLocation = Array.from(markers.values()).filter(
      (marker) => marker.properties?.locationKey === locationKey
    ) as GeoJSON.Feature<Point>[];
    
    if (markersAtLocation.length > 1) {
      // Get the original coordinates
      const firstMarker = markersAtLocation[0];
      const baseLng = firstMarker.geometry.coordinates[0];
      const baseLat = firstMarker.geometry.coordinates[1];
      
      // Calculate all the spidered-out positions
      const spideredPositions: LngLat[] = markersAtLocation.map((_, index) => {
        const offset = calculateSpiderOffset(index, markersAtLocation.length);
        return {
          lng: baseLng + offset[0],
          lat: baseLat + offset[1],
        };
      });
      
      // Create bounding box and fit map to it
      const bounds = getBoundingBox(spideredPositions);
      mapRef.value.fitBounds(bounds, {
        padding: 80, // Add padding so markers aren't at the edge
        duration: 500, // Smooth animation
      });
    }
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

      const locationKey = point.properties?.locationKey as string;
      const totalMarkersAtLocation = point.properties?.totalMarkersAtLocation as number;
      const isSpideredOut = point.properties?.isSpideredOut as boolean;
      
      // If there are multiple markers at this location and they're not spidered out yet,
      // spider them out instead of showing the popup
      if (totalMarkersAtLocation > 1 && !isSpideredOut) {
        toggleSpiderLocation(locationKey);
        return;
      }
      
      // If spidered out or only one marker, show the popup
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

      // Add a new GeoJSON source WITHOUT clustering
      // We handle stacked markers manually with spider-out behavior
      if (!map.getSource(MARKERS_SOURCE_ID)) {
        map.addSource(MARKERS_SOURCE_ID, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: getFeaturesWithOffset(markers),
          },
          cluster: false, // Disable automatic clustering
        });
      }
      
      // Add source for spider lines (connecting center to spidered markers)
      if (!map.getSource(SPIDER_LINES_SOURCE_ID)) {
        map.addSource(SPIDER_LINES_SOURCE_ID, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: getSpiderLineFeatures(markers),
          },
        });
      }

      // Note: Cluster layers are not used since we disabled clustering
      // We handle stacked markers manually with spider-out behavior
      
      // Add layer for spider lines (draw before markers so they appear underneath)
      if (!map.getLayer(SPIDER_LINES_LAYER_ID)) {
        map.addLayer({
          id: SPIDER_LINES_LAYER_ID,
          type: "line",
          source: SPIDER_LINES_SOURCE_ID,
          paint: {
            "line-color": "#999999",
            "line-width": 2,
            "line-opacity": 0.6,
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
      
      // Add a layer to show count for stacked markers (multiple markers at same location)
      const STACKED_COUNT_LAYER_ID = "stacked-count";
      if (!map.getLayer(STACKED_COUNT_LAYER_ID)) {
        map.addLayer({
          id: STACKED_COUNT_LAYER_ID,
          type: "symbol",
          source: MARKERS_SOURCE_ID,
          filter: [
            "all",
            [">", ["get", "totalMarkersAtLocation"], 1], // has multiple markers
            ["!", ["get", "isSpideredOut"]], // not spidered out
            ["get", "isFirstAtLocation"], // only show on first marker at location
          ],
          layout: {
            "text-font": ["Arial Bold"],
            "text-field": ["get", "totalMarkersAtLocation"],
            "text-size": 12,
            "text-offset": [0, 0.1],
          },
          paint: {
            "text-color": "white",
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
