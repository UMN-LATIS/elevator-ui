<template>
  <div class="location-picker bg-black/5 p-2 rounded-md flex flex-col gap-2">
    <div class="flex gap-4 sm:justify-end items-center">
      <button
        v-for="(style, key) in mapStyles"
        :key="key"
        class="text-sm"
        type="button"
        :class="{
          'font-bold': key === activeMapStyleKey,
          'text-neutral-400': key !== activeMapStyleKey,
        }"
        @click="handleActiveStyleChange(key)">
        {{ style.label }}
      </button>
    </div>
    <div class="map-container">
      <div ref="mapContainer" class="map h-md rounded-sm"></div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <InputGroup
        :id="`${id}-longitude`"
        v-model.number="inputLng"
        label="Longitude"
        placeholder="Enter longitude"
        @change="updateMarkerFromInput" />
      <InputGroup
        :id="`${id}-latitude`"
        v-model.number="inputLat"
        label="Latitude"
        placeholder="Enter latitude"
        @change="updateMarkerFromInput" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, shallowRef, useId, computed } from "vue";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import config from "@/config";
import invariant from "tiny-invariant";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import { LocationWidgetContent, WithId } from "@/types";

interface LatLng {
  lat: number;
  lng: number;
}

const props = withDefaults(
  defineProps<{
    modelValue: WithId<LocationWidgetContent>;
    initialZoom?: number;
  }>(),
  {
    initialZoom: 1,
  }
);

const id = computed(() => props.modelValue.id || useId());

const location = computed(
  (): LatLng => ({
    lng: Number(props.modelValue.loc?.coordinates?.[0].toFixed(6)) ?? 0,
    lat: Number(props.modelValue.loc?.coordinates?.[1].toFixed(6)) ?? 0,
  })
);

const emit = defineEmits<{
  (e: "update:modelValue", widgetContent: WithId<LocationWidgetContent>): void;
}>();

const mapContainer = ref<HTMLElement | null>(null);
const map = shallowRef<maplibregl.Map | null>(null);
const marker = shallowRef<maplibregl.Marker | null>(null);
const markerPosition = ref<LatLng>(location.value);

// Input fields for manual coordinate entry
const inputLat = ref<number>(location.value.lat);
const inputLng = ref<number>(location.value.lng);

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

const activeMapStyleKey = ref<keyof typeof mapStyles>("light");

const getArcGISUrl = (styleKey: string) => {
  const baseUrl = `https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2`;
  const { name, url } = mapStyles[styleKey];
  return url || `${baseUrl}${name}?token=${config.arcgis.apiKey}`;
};

const emitUpdateLocation = (location: LatLng) => {
  emit("update:modelValue", {
    ...props.modelValue,
    loc: {
      ...props.modelValue.loc,
      coordinates: [location.lng, location.lat],
    },
  });
};

// Function to set up marker
const setupMarker = (position: LatLng) => {
  if (!map.value) return;

  // Create a draggable marker
  marker.value = new maplibregl.Marker({
    draggable: true,
    color: "#FF0000",
  })
    .setLngLat([position.lng, position.lat])
    .addTo(map.value);

  // Update coordinates when marker is dragged
  marker.value.on("dragend", () => {
    if (!marker.value) return;

    const lngLat = marker.value.getLngLat();
    const roundedLngLat = {
      lat: Number(lngLat.lat.toFixed(6)),
      lng: Number(lngLat.lng.toFixed(6)),
    };
    markerPosition.value = lngLat;

    // Update input fields to match marker position
    inputLat.value = roundedLngLat.lat;
    inputLng.value = roundedLngLat.lng;

    emitUpdateLocation(roundedLngLat);
  });
};

// Function to set up map event listeners
const setupMapEvents = () => {
  if (!map.value) return;

  // Allow clicking on the map to move the marker
  map.value.on("click", (e: maplibregl.MapMouseEvent) => {
    if (!marker.value) return;
    const roundedLngLat = {
      lat: Number(e.lngLat.lat.toFixed(6)),
      lng: Number(e.lngLat.lng.toFixed(6)),
    };

    marker.value.setLngLat(roundedLngLat);
    markerPosition.value = roundedLngLat;

    // Update input fields to match marker position
    inputLat.value = roundedLngLat.lat;
    inputLng.value = roundedLngLat.lng;

    emitUpdateLocation(roundedLngLat);
  });
};

function handleActiveStyleChange(key: keyof typeof mapStyles): void {
  if (!map.value) throw new Error("Cannot update style: no map");

  activeMapStyleKey.value = key;
  map.value.setStyle(getArcGISUrl(key));
}

const initializeMap = (): void => {
  console.log("Initializing map...");
  if (!mapContainer.value) return;

  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: getArcGISUrl(activeMapStyleKey.value),
    center: [location.value.lng, location.value.lat],
    zoom: props.initialZoom,
  });

  map.value.on("load", () => {
    invariant(map.value, "Map should be initialized");
    setupMarker(location.value);
    setupMapEvents();
  });
};

// Function to update marker position from input fields
const updateMarkerFromInput = (): void => {
  // Validate inputs
  if (
    inputLat.value === undefined ||
    inputLng.value === undefined ||
    isNaN(inputLat.value) ||
    isNaN(inputLng.value)
  ) {
    return;
  }

  // Clamp latitude values to valid range
  const validLat = Math.max(-90, Math.min(90, inputLat.value));
  if (validLat !== inputLat.value) {
    inputLat.value = validLat;
  }

  // Clamp longitude values to valid range
  const validLng = Math.max(-180, Math.min(180, inputLng.value));
  if (validLng !== inputLng.value) {
    inputLng.value = validLng;
  }

  if (map.value && marker.value) {
    const newPosition = {
      lat: inputLat.value,
      lng: inputLng.value,
    };

    // Update marker on map
    marker.value.setLngLat([newPosition.lng, newPosition.lat]);

    // Center map on new position
    map.value.flyTo({
      center: [newPosition.lng, newPosition.lat],
      duration: 1000, // ms
    });

    // Update marker position state
    markerPosition.value = newPosition;

    // Emit update event
    emitUpdateLocation(newPosition);
  }
};

onMounted(() => {
  initializeMap();
});

// Watch for changes to initialCenter prop
watch(
  () => props.modelValue,
  (newContentItem) => {
    const newLngLat = {
      lng: newContentItem.loc?.coordinates?.[0] ?? 0,
      lat: newContentItem.loc?.coordinates?.[1] ?? 0,
    };
    if (map.value && marker.value) {
      map.value.setCenter([newLngLat.lng, newLngLat.lat]);
      marker.value.setLngLat([newLngLat.lng, newLngLat.lat]);
      markerPosition.value = newLngLat;

      // Update input fields
      inputLat.value = newLngLat.lat;
      inputLng.value = newLngLat.lng;
    }
  },
  { deep: true }
);
</script>

<style scoped></style>
