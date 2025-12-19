<template>
  <div class="map-cluster-test p-8">
    <div class="mb-6 p-4 bg-gray-100 rounded">
      <p class="text-sm font-semibold mb-2">Test Pages:</p>
      <div class="flex gap-4 text-sm">
        <router-link to="/tests/map" class="text-blue-500 hover:underline">
          Cluster Test
        </router-link>
        <span class="font-bold text-blue-600">Single Cluster Test</span>
        <router-link
          to="/tests/map-stress"
          class="text-blue-500 hover:underline">
          Stress Test
        </router-link>
      </div>
    </div>
    <h1 class="text-3xl font-bold mb-4">Map Single Cluster Test</h1>
    <p class="mb-4 text-gray-600">
      Tests initial zoom with 5 points all at the same location using bounds.
    </p>
    <ul class="mb-6 text-sm list-disc list-inside space-y-1">
      <li>
        <strong>Test:</strong>
        5 markers at exact same location with bounds set
      </li>
      <li>
        <strong>Expected:</strong>
        Should load zoomed out enough to see spidered points (max zoom 16)
      </li>
      <li>
        <strong>Spider threshold:</strong>
        Zoom level 14, so initial load should show spider visualization
      </li>
    </ul>

    <Map
      :zoom="11"
      mapStyle="light"
      :apiKey="config.arcgis.apiKey"
      :center="center"
      :bounds="bounds"
      mapContainerClass="!h-[70vh]">
      <MapMarker
        v-for="marker in markers"
        :id="marker.id"
        :key="marker.id"
        :lng="marker.lng"
        :lat="marker.lat">
        <MapPopup>
          <h2 class="font-bold text-lg mb-2">{{ marker.title }}</h2>
          <p class="text-sm">{{ marker.description }}</p>
          <p class="text-xs text-gray-500 mt-2">
            Location: {{ marker.lng }}, {{ marker.lat }}
          </p>
        </MapPopup>
      </MapMarker>
    </Map>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, computed } from "vue";
import config from "@/config";
import { LngLat, BoundingBox } from "@/types";

const Map = defineAsyncComponent(() => import("@/components/Map/Map.vue"));
const MapMarker = defineAsyncComponent(
  () => import("@/components/MapMarker/MapMarker.vue")
);
const MapPopup = defineAsyncComponent(
  () => import("@/components/MapPopup/MapPopup.vue")
);

const center: LngLat = {
  lng: -93.265,
  lat: 44.9778,
};

// 5 markers all at the EXACT same location
const markers = [
  {
    id: "test-1",
    lng: -93.265,
    lat: 44.9778,
    title: "Test Location 1",
    description: "First marker at this location",
  },
  {
    id: "test-2",
    lng: -93.265,
    lat: 44.9778,
    title: "Test Location 2",
    description: "Second marker at this location",
  },
  {
    id: "test-3",
    lng: -93.265,
    lat: 44.9778,
    title: "Test Location 3",
    description: "Third marker at this location",
  },
  {
    id: "test-4",
    lng: -93.265,
    lat: 44.9778,
    title: "Test Location 4",
    description: "Fourth marker at this location",
  },
  {
    id: "test-5",
    lng: -93.265,
    lat: 44.9778,
    title: "Test Location 5",
    description: "Fifth marker at this location",
  },
];

// Create bounds from markers (all same point, so bounds will be very small)
const bounds = computed<BoundingBox>(() => {
  const lng = markers[0].lng;
  const lat = markers[0].lat;

  // Create a tiny bounding box around the single point
  return [
    [lng - 0.0001, lat - 0.0001],
    [lng + 0.0001, lat + 0.0001],
  ];
});
</script>
