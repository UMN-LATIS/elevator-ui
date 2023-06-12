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
    <p class="filter-row__name text-sm p-2">Any Location</p>
    <div class="flex flex-col">
      <div class="filter-row__value flex flex-col sm:flex-row gap-1">
        <div>
          <InputGroup
            v-if="searchStore.filterBy.globalLocation"
            id="filter-by-location-lng"
            :modelValue="searchStore.filterBy.globalLocation.lng.toString()"
            class="text-sm flex flex-col"
            inputClass="!bg-white !border !border-neutral-200"
            :labelHidden="true"
            label="Longitude"
            placeholder="Lng"
            @update:modelValue="handleLngUpdate"
          />
          <p
            v-if="isLngTouched && !isLngValid"
            class="text-xs text-red-500 mt-1"
          >
            Longitude must be between -180 and 180
          </p>
        </div>
        <div>
          <InputGroup
            v-if="searchStore.filterBy.globalLocation"
            id="filter-by-location-lat"
            :modelValue="searchStore.filterBy.globalLocation.lat.toString()"
            class="text-sm"
            inputClass="!bg-white !border !border-neutral-200"
            :labelHidden="true"
            label="Latitude"
            placeholder="Lat"
            @update:modelValue="handleLatUpdate"
          />
          <p
            v-if="isLatTouched && !isLatValid"
            class="text-xs text-red-500 mt-2"
          >
            Latitude must be between -90 and 90
          </p>
        </div>
        <div>
          <InputGroup
            v-if="searchStore.filterBy.globalLocation"
            id="filter-by-location-radius"
            :modelValue="searchStore.filterBy.globalLocation.radius.toString()"
            class="text-sm"
            inputClass="!bg-white !border !border-neutral-200"
            :labelHidden="true"
            label="Within Radius"
            placeholder="Radius"
            @update:modelValue="handleRadiusUpdate"
          >
            <template #append>
              <button
                class="text-xs text-neutral-400 uppercase pr-2 cursor-default"
                type="button"
                @click="focusRadiusInput"
              >
                miles
              </button>
            </template>
          </InputGroup>
          <p
            v-if="isRadiusTouched && !isRadiusValid"
            class="text-xs text-red-500 mt-2"
          >
            Radius must be larger than 0
          </p>
        </div>
      </div>
      <Map
        v-if="mapCenter"
        :center="mapCenter"
        :zoom="3"
        :apiKey="config.arcgis.apiKey"
        class="my-2 border border-neutral-300 rounded-md"
        labelsClass="hidden"
        mapContainerClass="!h-[12rem] !min-h-[12rem]"
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
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import Map from "@/components/Map/Map.vue";
import MapMarker from "@/components/MapMarker/MapMarker.vue";
import { LngLat } from "@/types";
import config from "@/config";
import { GeoJSONSource, Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";
import turfCircle from "@turf/circle";

defineProps<{
  rowIndex: number;
}>();

const searchStore = useSearchStore();

const isLatTouched = ref(false);
const isLngTouched = ref(false);
const isRadiusTouched = ref(false);
const mapRef = ref<MapLibreMap | null>(null);

const searchOperator = computed(
  () => searchStore.filterBy.searchableFieldsOperator
);

const isLatValid = computed(() => {
  const lat = latFloat.value;
  return !isNaN(lat) && lat >= -90 && lat <= 90;
});

const isLngValid = computed(() => {
  const lng = lngFloat.value;
  return !isNaN(lng) && lng >= -180 && lng <= 180;
});

const isRadiusValid = computed(() => {
  const radius = radiusFloat.value;
  return !isNaN(radius) && radius > 0;
});

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

function focusRadiusInput() {
  // if Miles label is clicked, focus the input
  document
    .querySelector<HTMLInputElement>("#filter-by-location-radius")
    ?.focus();
}

function handleLngUpdate(newLng: string) {
  isLngTouched.value = true;
  searchStore.updateLocationFilter({
    lng: newLng,
  });
}

function handleLatUpdate(newLat: string) {
  isLatTouched.value = true;
  searchStore.updateLocationFilter({
    lat: newLat,
  });
}

function handleRadiusUpdate(newRadius: string) {
  isRadiusTouched.value = true;
  searchStore.updateLocationFilter({
    radius: newRadius,
  });
}

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
