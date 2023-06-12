<template>
  <div
    class="filter-row"
    :class="{
      'filter-row--is-only-row': searchStore.totalFieldFilterCount === 1,
      'filter-row--is-first-row': rowIndex === 0,
    }"
  >
    <Button
      class="text-xs filter-row__operator"
      variant="tertiary"
      type="button"
      @click="handleSearchOperatorClick"
    >
      {{ searchOperator }}
    </Button>
    <p class="filter-row__name text-sm p-2 self-start">Any Location</p>
    <div class="filter-row__value">
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
        <div class="flex items-center gap-4">
          <Tuple label="Lng" variant="value-only">
            {{ Math.abs(lngFloat).toFixed(4) }}°
            {{ lngFloat > 0 ? "E" : "W" }}
          </Tuple>
          <Tuple label="Lat" variant="value-only">
            {{ Math.abs(latFloat).toFixed(4) }}°
            {{ latFloat > 0 ? "N" : "S" }}
          </Tuple>
        </div>
        <div class="flex items-center gap-2 mt-2 mb-4">
          <label
            for="filter-by-location-radius"
            class="text-xs uppercase flex items-baseline"
          >
            Radius
          </label>
          <input
            v-if="searchStore.filterBy.globalLocation"
            id="filter-by-location-radius"
            v-model="searchStore.filterBy.globalLocation.radius"
            class="flex-1"
            type="range"
            min="1"
            max="4000"
          />
          <span class="text-xs">{{ Math.round(radiusFloat) }} mi</span>
        </div>
      </div>
    </div>

    <button
      class="filter-row__remove py-2 self-start w-full flex items-center justify-center"
      type="button"
      @click="handleRemoveFilter"
    >
      <CircleXIcon class="!w-5 !h-5" />
    </button>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Button from "@/components/Button/Button.vue";
import { CircleXIcon } from "@/icons";
import { useSearchStore } from "@/stores/searchStore";
import Map from "@/components/Map/Map.vue";
import MapMarker from "@/components/MapMarker/MapMarker.vue";
import { LngLat } from "@/types";
import config from "@/config";
import { GeoJSONSource, Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";
import turfCircle from "@turf/circle";
import Tuple from "../Tuple/Tuple.vue";

defineProps<{
  rowIndex: number;
}>();

const searchStore = useSearchStore();
const mapRef = ref<MapLibreMap | null>(null);

const searchOperator = computed(
  () => searchStore.filterBy.searchableFieldsOperator
);

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

function handleSearchOperatorClick() {
  const currentOperator = searchStore.filterBy.searchableFieldsOperator;
  const newOperator = currentOperator === "AND" ? "OR" : "AND";
  searchStore.updateSearchableFieldsOperator(newOperator);
}

function handleRemoveFilter() {
  searchStore.removeLocationFilter();
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
<style scoped>
.filter-row {
  display: grid;
  grid-template-areas: "operator name value is-fuzzy remove";
  grid-template-columns: 2rem 1fr 2fr 3rem 2rem;
  align-items: baseline;
  gap: 0.25rem;
}

@media (max-width: 30rem) {
  .filter-row {
    grid-template-areas:
      "operator name is-fuzzy remove"
      ". value . .";
    grid-template-columns: 2rem 1fr 3rem 2rem;
  }
}

.filter-row--is-only-row {
  grid-template-areas: "name value is-fuzzy remove";
  grid-template-columns: 1fr 2fr 3rem 2rem;
}

.filter-row--is-first-row .filter-row__operator {
  display: none;
}

.filter-row__operator {
  grid-area: operator;
}
.filter-row__name {
  grid-area: name;
}

.filter-row__value {
  grid-area: value;
}

.filter-row__is-fuzzy {
  grid-area: is-fuzzy;
}

.filter-row__remove {
  grid-area: remove;
  justify-self: end;
}
</style>
