<template>
  <div class="location-picker rounded-md flex flex-col gap-2">
    <div class="map-container relative">
      <div
        class="flex gap-4 sm:justify-end items-center flex-wrap absolute top-2 right-2 z-10 bg-surface-container-high rounded-md px-3 py-1.5 shadow-md border border-outline-variant">
        <button
          v-for="(style, key) in mapStyles"
          :key="key"
          class="text-sm"
          type="button"
          :class="{
            'font-bold': key === state.activeMapStyleKey,
            'text-on-surface-variant': key !== state.activeMapStyleKey,
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
      <div>
        <InputGroup
          :id="`${id}-longitude`"
          v-model="state.lngInput"
          label="Longitude"
          placeholder="Enter longitude"
          :aria-invalid="lngError ? 'true' : undefined"
          :aria-describedby="lngError ? `${id}-longitude-error` : undefined"
          @focus="isCoordinateInputFocused.lng = true"
          @blur="handleCoordinateInputBlur('lng')" />
        <p
          v-if="lngError"
          :id="`${id}-longitude-error`"
          class="text-error text-xs">
          {{ lngError }}
        </p>
      </div>
      <div>
        <InputGroup
          :id="`${id}-latitude`"
          v-model="state.latInput"
          label="Latitude"
          placeholder="Enter latitude"
          :aria-invalid="latError ? 'true' : undefined"
          :aria-describedby="latError ? `${id}-latitude-error` : undefined"
          @focus="isCoordinateInputFocused.lat = true"
          @blur="handleCoordinateInputBlur('lat')" />
        <p
          v-if="latError"
          :id="`${id}-latitude-error`"
          class="text-error text-xs">
          {{ latError }}
        </p>
      </div>
    </div>
    <div>
      <label
        :for="`${id}-address`"
        class="text-xs font-medium text-on-surface-variant uppercase">
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
import { useTheming } from "@/helpers/useTheming";
import {
  toLngLat,
  validateLatInput,
  validateLngInput,
} from "@/helpers/coordinates";

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

const { effectiveTheme } = useTheming();

const getDefaultMapStyle = (): keyof typeof mapStyles =>
  effectiveTheme.value?.includes("dark") ? "dark" : "light";

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

// Input fields for manual coordinate entry. Stored coordinates may be an
// empty or partial array, so optional-chain each entry.
const state = reactive({
  lngInput: props.modelValue.loc?.coordinates?.[0]?.toString() ?? "",
  latInput: props.modelValue.loc?.coordinates?.[1]?.toString() ?? "",
  locationLabel: props.modelValue.locationLabel,
  activeMapStyleKey: getDefaultMapStyle(),
});

// Empty input means "no location", only non-empty input can be invalid.
const lngError = computed((): string => {
  if (state.lngInput.trim() === "") return "";
  return validateLngInput(state.lngInput);
});
const latError = computed((): string => {
  if (state.latInput.trim() === "") return "";
  return validateLatInput(state.latInput);
});

const map = shallowRef<maplibregl.Map | null>(null);
const marker = shallowRef<maplibregl.Marker | null>(null);

function emitCoordinateUpdate(lngLat: LngLat | null) {
  const loc = lngLat
    ? {
        type: "Point",
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

// Half-typed coordinate text lives here, not in the model: only values the
// asset can actually store are committed, and the model's echo must not
// rewrite a field mid-keystroke (typing "-92." would come back as "-92").
const isCoordinateInputFocused = reactive({ lng: false, lat: false });

function handleCoordinateInputBlur(input: "lng" | "lat") {
  // only release the field for future model echoes: rewriting it here
  // would undo half of a clear-both-fields flow
  isCoordinateInputFocused[input] = false;
}

// update modelValue when input fields change
watch([() => state.lngInput, () => state.latInput], () => {
  // clearing both inputs removes the location from the asset
  if (state.lngInput.trim() === "" && state.latInput.trim() === "") {
    if (props.modelValue.loc) emitCoordinateUpdate(null);
    return;
  }

  const lng = parseFloat(state.lngInput);
  const lat = parseFloat(state.latInput);

  // if it's not a number, ignore it
  // the user may be typing
  if (isNaN(lng) || isNaN(lat)) {
    return;
  }

  // out-of-range values stay in the inputs with their error: the model
  // only takes coordinates a save may store
  if (lngError.value || latError.value) {
    return;
  }

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

    // sync local inputs, but never a field the user is typing into
    if (!isCoordinateInputFocused.lng) {
      state.lngInput = coordinates?.[0]?.toString() ?? "";
    }
    if (!isCoordinateInputFocused.lat) {
      state.latInput = coordinates?.[1]?.toString() ?? "";
    }

    // absent, malformed, or out-of-range coordinates get no marker
    const center = toLngLat(coordinates);
    if (!center) {
      marker.value?.remove();
      marker.value = null;
      return;
    }

    // if there's a marker, update its position
    if (marker.value) {
      marker.value.setLngLat(center);
      return;
    }

    // if no marker, create one
    marker.value = new maplibregl.Marker({ draggable: true })
      .setLngLat(center)
      .addTo(map.value)
      .on("dragend", () => {
        const lngLat = marker.value?.getLngLat() ?? null;
        emitCoordinateUpdate(lngLat);
      });

    // fly to the new coordinates
    map.value.flyTo({
      center,
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

<style scoped>
.map-container :deep(.maplibregl-map) {
  border-radius: 0.25rem;
}
</style>

<style></style>
