<template>
  <div class="location-picker rounded-md flex flex-col gap-2">
    <div class="map-container relative">
      <div
        class="flex gap-4 sm:justify-end items-center flex-wrap absolute top-2 right-2 z-10 bg-white/80 rounded-md px-2 py-1 shadow-sm">
        <button
          v-for="(style, key) in mapStyles"
          :key="key"
          class="text-sm"
          type="button"
          :class="{
            'font-bold': key === state.activeMapStyleKey,
            'text-neutral-500': key !== state.activeMapStyleKey,
          }"
          @click="handleActiveStyleChange(key)">
          {{ style.label }}
        </button>
      </div>
      <div ref="mapContainer" class="w-full h-md rounded-sm"></div>
    </div>

    <InputGroup
      :id="`${id}-title`"
      :modelValue="props.modelValue.locationLabel ?? ''"
      label="Location Label"
      placeholder="Label"
      @update:modelValue="
        (value) => {
          $emit('update:modelValue', {
            ...props.modelValue,
            locationLabel: value.toString(),
          });
        }
      " />

    <div class="grid grid-cols-2 gap-4">
      <InputGroup
        :id="`${id}-longitude`"
        v-model="state.lngInput"
        label="Longitude"
        placeholder="Enter longitude" />
      <InputGroup
        :id="`${id}-latitude`"
        v-model="state.latInput"
        label="Latitude"
        placeholder="Enter latitude" />
    </div>
    <div>
      <label
        :for="`${id}-address`"
        class="text-xs font-medium text-gray-700 uppercase">
        Address Search
      </label>
      <ArcGisGeocoder
        :id="`${id}-address`"
        :initialValue="props.modelValue.address ?? ''"
        :apiKey="config.arcgis.apiKey"
        placeholder="Search for an address"
        @select="
          (geocoderResult) =>
            $emit('update:modelValue', {
              ...props.modelValue,
              address: geocoderResult.address,
              loc: {
                ...props.modelValue.loc,
                coordinates: [
                  roundFloat(geocoderResult.lng, 6),
                  roundFloat(geocoderResult.lat, 6),
                ],
              },
            })
        " />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  useId,
  computed,
  reactive,
  useTemplateRef,
  onMounted,
  watch,
  shallowRef,
} from "vue";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import config from "@/config";
import invariant from "tiny-invariant";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import ArcGisGeocoder from "./ArcGISGeocoder.vue";
import { LocationWidgetContent, WithId, LngLat, Coordinates } from "@/types";

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

const roundFloat = (value: number, decimalPlaces: number): number =>
  Number(value.toFixed(decimalPlaces));

const emit = defineEmits<{
  (e: "update:modelValue", widgetContent: WithId<LocationWidgetContent>): void;
}>();

const mapContainerRef = useTemplateRef<HTMLElement>("mapContainer");

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

// Input fields for manual coordinate entry
const state = reactive({
  lngInput: props.modelValue.loc?.coordinates?.[0].toString() ?? "", // local state for text input
  latInput: props.modelValue.loc?.coordinates?.[1].toString() ?? "",
  locationLabel: props.modelValue.locationLabel,
  activeMapStyleKey: "light" as keyof typeof mapStyles,
});

const map = shallowRef<maplibregl.Map | null>(null);
const marker = shallowRef<maplibregl.Marker | null>(null);

function emitCoordinateUpdate(lngLat: LngLat | null) {
  const loc = lngLat
    ? {
        ...props.modelValue.loc,
        coordinates: [
          roundFloat(lngLat.lng, 6),
          roundFloat(lngLat.lat, 6),
        ] as Coordinates,
      }
    : undefined;

  emit("update:modelValue", {
    ...props.modelValue,
    loc,
  });
}

// update modelValue when input fields change
watch([() => state.lngInput, () => state.latInput], () => {
  const lng = parseFloat(state.lngInput);
  const lat = parseFloat(state.latInput);

  // if it's not a number, ignore it
  // the user may be typing
  if (isNaN(lng) || isNaN(lat)) {
    return;
  }

  // Update the modelValue with the new coordinates
  emitCoordinateUpdate({
    lng,
    lat,
  });

  // fly to the new coordinates
  invariant(map.value, "Map is not initialized");
  map.value.flyTo({
    center: [lng, lat],
    animate: true,
  });
});

watch(
  [() => props.modelValue.loc?.coordinates, map],
  () => {
    if (!map.value) return;

    const coordinates = props.modelValue.loc?.coordinates ?? null;

    // sync local inputs
    state.lngInput = coordinates?.[0].toString() ?? "";
    state.latInput = coordinates?.[1].toString() ?? "";

    // if no coordinates, remove marker
    if (!coordinates) {
      marker.value?.remove();
      marker.value = null;
      return;
    }

    // if there's a marker, update its position
    if (marker.value) {
      marker.value.setLngLat(coordinates);
      return;
    }

    // if no marker, create one
    marker.value = new maplibregl.Marker({ draggable: true })
      .setLngLat(coordinates)
      .addTo(map.value)
      .on("dragend", () => {
        const lngLat = marker.value?.getLngLat() ?? null;
        emitCoordinateUpdate(lngLat);
      });

    // fly to the new coordinates
    map.value.flyTo({
      center: coordinates,
      animate: true,
    });
  },
  {
    immediate: true,
  }
);

function getArcGISUrl(styleKey: string) {
  const baseUrl = `https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2`;
  const { name, url } = mapStyles[styleKey];
  return url || `${baseUrl}${name}?token=${config.arcgis.apiKey}`;
}

function handleActiveStyleChange(styleKey: keyof typeof mapStyles) {
  invariant(map.value, "Map is not initialized");
  state.activeMapStyleKey = styleKey;
  map.value.setStyle(getArcGISUrl(styleKey));
}

onMounted(() => {
  invariant(mapContainerRef.value, "Map container is not defined");

  map.value = new maplibregl.Map({
    container: mapContainerRef.value,
    style: getArcGISUrl(state.activeMapStyleKey),
    center: [0, 0],
    zoom: props.initialZoom,
  }).on("click", (e) => {
    const lngLat = e.lngLat;
    emitCoordinateUpdate(lngLat);
  });
});
</script>

<style scoped></style>
