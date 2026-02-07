<template>
  <div class="map-cluster-test p-8">
    <div class="mb-6 p-4 bg-gray-100 rounded">
      <p class="text-sm font-semibold mb-2">Test Pages:</p>
      <div class="flex gap-4 text-sm">
        <router-link to="/tests/map" class="text-m3-primary hover:underline">
          Cluster Test
        </router-link>
        <router-link
          to="/tests/map-single-cluster"
          class="text-m3-primary hover:underline">
          Single Cluster Test
        </router-link>
        <span class="font-bold text-m3-primary">Stress Test</span>
      </div>
    </div>
    <h1 class="text-3xl font-bold mb-4">Map Stress Test</h1>
    <p class="mb-4 text-gray-600">
      Tests performance with hundreds of overlapping markers.
    </p>
    <ul class="mb-6 text-sm list-disc list-inside space-y-1">
      <li>
        <strong>Downtown:</strong>
        200 markers at exact same location
      </li>
      <li>
        <strong>University:</strong>
        50 markers at exact same location
      </li>
      <li>
        <strong>Expected:</strong>
        Should show clusters with counts, spider when zoomed in
      </li>
      <li>
        <strong>Performance:</strong>
        Should handle memoization and debouncing efficiently
      </li>
    </ul>

    <Map
      :zoom="11"
      mapStyle="light"
      :apiKey="config.arcgis.apiKey"
      :center="center"
      mapContainerClass="!h-[70vh]">
      <MapMarker
        v-for="marker in allMarkers"
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
import { LngLat } from "@/types";

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

// Generate 200 markers at downtown location
const downtownMarkers = Array.from({ length: 200 }, (_, i) => ({
  id: `downtown-${i + 1}`,
  lng: -93.265,
  lat: 44.9778,
  title: `Downtown Location ${i + 1}`,
  description: `Marker ${i + 1} of 200 at this downtown location`,
}));

// Generate 50 markers at university location
const universityMarkers = Array.from({ length: 50 }, (_, i) => ({
  id: `university-${i + 1}`,
  lng: -93.2277,
  lat: 44.9748,
  title: `University Location ${i + 1}`,
  description: `Marker ${i + 1} of 50 at this university location`,
}));

// Combine all markers
const allMarkers = computed(() => [...downtownMarkers, ...universityMarkers]);
</script>
