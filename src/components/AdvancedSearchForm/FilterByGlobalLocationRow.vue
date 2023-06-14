<template>
  <BaseFilterRow
    v-if="searchStore.filterBy.globalLocation"
    :rowIndex="rowIndex"
    label="Any Location"
    @remove="searchStore.removeLocationFilter"
  >
    <div class="flex items-baseline mt-2 text-sm gap-2">
      <span>
        {{ Math.abs(lngFloat).toFixed(4) }}°
        {{ lngFloat > 0 ? "E" : "W" }}
      </span>
      <span>
        {{ Math.abs(latFloat).toFixed(4) }}°
        {{ latFloat > 0 ? "N" : "S" }}
      </span>
    </div>
    <Map
      v-if="mapCenter"
      :center="mapCenter"
      :zoom="2"
      :apiKey="config.arcgis.apiKey"
      class="my-2 border border-neutral-300 rounded-md"
      labelsClass="hidden"
      mapContainerClass="!h-[12rem] !min-h-[12rem]"
      :fullscreenControl="false"
      :mapOptions="{
        attributionControl: false,
      }"
      @load="handleMapLoad"
    >
      <MapMarker
        v-if="lngFloat && latFloat"
        id="search-by-location-map-marker"
        :lng="lngFloat"
        :lat="latFloat"
      />
    </Map>
    <div>
      <InputGroup
        id="filter-by-global-location-radius"
        :modelValue="searchStore.filterBy.globalLocation.radius ?? ''"
        type="text"
        label="Search Radius"
        :labelClass="{
          '!text-red-700': radiusTouched && !isRadiusValid,
        }"
        :inputClass="{
          'bg-white !border-neutral-200': true,
          'border-red-600 text-red-700': radiusTouched && !isRadiusValid,
        }"
        @update:modelValue="handleRadiusUpdate"
      >
        <template #append>
          <span
            class="text-sm text-neutral-600 mr-2"
            :class="{
              '!text-red-700': radiusTouched && !isRadiusValid,
            }"
            >miles</span
          >
        </template>
      </InputGroup>
      <p
        v-if="radiusTouched && !isRadiusValid"
        class="text-xs text-red-700 mt-2"
      >
        Radius must be a number greater than 0.
      </p>
    </div>
  </BaseFilterRow>
</template>
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useSearchStore } from "@/stores/searchStore";
import Map from "@/components/Map/Map.vue";
import MapMarker from "@/components/MapMarker/MapMarker.vue";
import { LngLat } from "@/types";
import config from "@/config";
import { GeoJSONSource, Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";
import turfCircle from "@turf/circle";
import InputGroup from "../InputGroup/InputGroup.vue";
import BaseFilterRow from "./BaseFilterRow.vue";

defineProps<{
  rowIndex: number;
}>();

const searchStore = useSearchStore();
const mapRef = ref<MapLibreMap | null>(null);
const radiusTouched = ref(false);

const mapCenter = computed((): LngLat | null => {
  if (!lngFloat.value || !latFloat.value) {
    return null;
  }

  return { lng: lngFloat.value, lat: latFloat.value };
});

const lngFloat = computed(() => {
  return parseFloat(searchStore.filterBy.globalLocation?.lng ?? "");
});

const latFloat = computed(() => {
  return parseFloat(searchStore.filterBy.globalLocation?.lat ?? "");
});

const radiusFloat = computed(() => {
  return parseFloat(searchStore.filterBy.globalLocation?.radius ?? "");
});

const circleGeoJson = computed(() => {
  if (!lngFloat.value || !latFloat.value || !radiusFloat.value) {
    return null;
  }

  const center = [lngFloat.value, latFloat.value];
  return turfCircle(center, radiusFloat.value, {
    steps: 36,
    units: "miles",
  });
});

const isRadiusValid = computed(() => {
  return radiusFloat.value > 0;
});

function handleRadiusUpdate(newRadius: string) {
  radiusTouched.value = true;
  searchStore.updateLocationFilter({
    radius: newRadius,
  });
}

function handleMapLoad(map: MapLibreMap) {
  // eslint-disable-next-line
  // @ts-ignore - deep nested type conplaints
  mapRef.value = map as MapLibreMap;

  map.on("click", (e: MapMouseEvent) => {
    const lngLat = e.lngLat;
    searchStore.updateLocationFilter({
      lng: lngLat.lng.toString(),
      lat: lngLat.lat.toString(),
    });
  });

  // add a new source and layer for the
  // radius circle if needed
  if (!map.getSource("radius-circle")) {
    map.addSource("radius-circle", {
      type: "geojson",
      data: circleGeoJson.value,
    });
  }

  if (!map.getLayer("radius-circle")) {
    map.addLayer({
      id: "radius-circle",
      type: "fill",
      source: "radius-circle",
      paint: {
        "fill-color": "#f03",
        "fill-opacity": 0.2,
      },
    });
  }
}

function renderRadiusCircle() {
  const map = mapRef.value;
  const circle = circleGeoJson.value;

  if (!map || !circle) return;

  // if map is not loaded yet, then we're done. The onLoad event
  // handle drawing the circle as it sets up the layer and source
  if (!map.loaded()) {
    return;
  }

  const source = map.getSource("radius-circle");
  if (!source) {
    throw new Error(
      "Cannot render radius circle. Expected source to be defined."
    );
  }
  if (!(source instanceof GeoJSONSource)) {
    throw new Error("Expected source to be a GeoJSONSource");
  }

  source.setData(circle);
}

watch([lngFloat, latFloat, radiusFloat], () => renderRadiusCircle());
</script>
<style scoped></style>
