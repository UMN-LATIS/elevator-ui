<template>
  <div class="map-cluster-test p-8">
    <div class="mb-6 p-4 bg-gray-100 rounded">
      <p class="text-sm font-semibold mb-2">Test Pages:</p>
      <div class="flex gap-4 text-sm">
        <span class="font-bold text-blue-600">Cluster Test</span>
        <router-link
          to="/tests/map-single-cluster"
          class="text-blue-500 hover:underline">
          Single Cluster Test
        </router-link>
        <router-link
          to="/tests/map-stress"
          class="text-blue-500 hover:underline">
          Stress Test
        </router-link>
      </div>
    </div>
    <h1 class="text-3xl font-bold mb-4">Map Clustering Test</h1>
    <p class="mb-4 text-gray-600">
      This test page demonstrates the clustering behavior:
    </p>
    <ul class="mb-6 text-sm list-disc list-inside space-y-1">
      <li>
        <strong>Downtown Minneapolis (5 markers at exact same location):</strong>
        Should show as a numbered cluster
      </li>
      <li>
        <strong>University of Minnesota (3 markers at exact same location):</strong>
        Should show as a numbered cluster
      </li>
      <li>
        <strong>St. Paul (2 markers at exact same location):</strong>
        Should show as a small cluster
      </li>
      <li>
        <strong>Individual markers:</strong>
        Lake Calhoun, Minnehaha Falls, and Mall of America as single points
      </li>
    </ul>

    <Map
      :zoom="11"
      mapStyle="light"
      :apiKey="config.arcgis.apiKey"
      :center="center"
      mapContainerClass="!h-[70vh]">
      <!-- Downtown Minneapolis - 5 markers at EXACT same location -->
      <MapMarker
        v-for="marker in downtownMarkers"
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

      <!-- University of Minnesota - 3 markers at EXACT same location -->
      <MapMarker
        v-for="marker in universityMarkers"
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

      <!-- St. Paul - 2 markers at EXACT same location -->
      <MapMarker
        v-for="marker in stPaulMarkers"
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

      <!-- Individual markers (not clustered) -->
      <MapMarker
        v-for="marker in individualMarkers"
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
import { defineAsyncComponent } from "vue";
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

// Downtown Minneapolis - 5 markers at the EXACT same coordinates
const downtownMarkers = [
  {
    id: "downtown-1",
    lng: -93.265,
    lat: 44.9778,
    title: "Downtown Office Building A",
    description: "First office building at this location",
  },
  {
    id: "downtown-2",
    lng: -93.265,
    lat: 44.9778,
    title: "Downtown Office Building B",
    description: "Second office building at this location",
  },
  {
    id: "downtown-3",
    lng: -93.265,
    lat: 44.9778,
    title: "Downtown Retail Store",
    description: "Retail store at this location",
  },
  {
    id: "downtown-4",
    lng: -93.265,
    lat: 44.9778,
    title: "Downtown Restaurant",
    description: "Restaurant at this location",
  },
  {
    id: "downtown-5",
    lng: -93.265,
    lat: 44.9778,
    title: "Downtown Hotel",
    description: "Hotel at this location",
  },
];

// University of Minnesota - 3 markers at EXACT same location
const universityMarkers = [
  {
    id: "umn-1",
    lng: -93.2277,
    lat: 44.9748,
    title: "Northrop Auditorium",
    description: "Historic auditorium on campus",
  },
  {
    id: "umn-2",
    lng: -93.2277,
    lat: 44.9748,
    title: "Science Lab",
    description: "Research facility on campus",
  },
  {
    id: "umn-3",
    lng: -93.2277,
    lat: 44.9748,
    title: "Student Union",
    description: "Student center on campus",
  },
];

// St. Paul - 2 markers at EXACT same location
const stPaulMarkers = [
  {
    id: "stp-1",
    lng: -93.094,
    lat: 44.9537,
    title: "Cathedral of Saint Paul",
    description: "Historic cathedral",
  },
  {
    id: "stp-2",
    lng: -93.094,
    lat: 44.9537,
    title: "Cathedral Museum",
    description: "Museum at the cathedral",
  },
];

// Individual markers (not clustered)
const individualMarkers = [
  {
    id: "individual-1",
    lng: -93.3122,
    lat: 44.9484,
    title: "Lake Calhoun",
    description: "Popular Minneapolis lake",
  },
  {
    id: "individual-2",
    lng: -93.2109,
    lat: 44.9153,
    title: "Minnehaha Falls",
    description: "Beautiful waterfall park",
  },
  {
    id: "individual-3",
    lng: -93.2419,
    lat: 44.8548,
    title: "Mall of America",
    description: "Large shopping mall in Bloomington",
  },
];
</script>
