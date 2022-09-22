<template>
  <div class="location-item p-4 bg-transparent-white-800 shadow-sm rounded">
    <p v-if="locationLabel">{{ locationLabel }}</p>
    <div class="my-4 flex gap-4 w-min">
      <Tuple label="Latitude" class="w-auto">{{ latStr }}</Tuple>
      <Tuple label="Longitude" class="w-auto">{{ lngStr }}</Tuple>
    </div>
    <Button
      v-if="hasLocation"
      icon="map"
      iconPosition="start"
      @click="isOpen = true"
      >Show Location</Button
    >
  </div>

  <Modal :isOpen="isOpen" :label="locationLabel" @close="isOpen = false">
    <Map
      :center="mapCenter"
      :zoom="10"
      mapStyle="streets"
      :accessToken="config.mapBox.accessToken"
      class="rounded bg-neutral-100 p-1"
    >
      <MapMarker :lng="mapCenter.lng" :lat="mapCenter.lat" />
    </Map>
    <div class="my-4 flex gap-4 w-min">
      <Tuple label="Latitude" class="w-auto">{{ latStr }}</Tuple>
      <Tuple label="Longitude" class="w-auto">{{ lngStr }}</Tuple>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { LocationWidgetProps, LocationWidgetContent, LngLat } from "@/types";
import { computed, ref } from "vue";
import Modal from "@/components/Modal/Modal.vue";
import Map from "@/components/Map/Map.vue";
import config from "@/config";
import MapMarker from "@/components/MapMarker/MapMarker.vue";
import Tuple from "@/components/Tuple/Tuple.vue";
import Button from "@/components/Button/Button.vue";

interface Props {
  locationContent: LocationWidgetContent;
  widget: LocationWidgetProps;
}

const props = defineProps<Props>();

const lat = computed((): number => {
  return props.locationContent.loc?.coordinates?.[1] ?? 0;
});

const lng = computed((): number => {
  return props.locationContent.loc?.coordinates?.[0] ?? 0;
});

const lngStr = computed((): string => (lng.value ? lng.value.toFixed(4) : "-"));
const latStr = computed((): string => (lat.value ? lat.value.toFixed(4) : "-"));

const mapCenter = computed(
  () =>
    ({
      lng: lng.value,
      lat: lat.value,
    } as LngLat)
);

const locationLabel = computed(
  () => props.locationContent.locationLabel || props.locationContent.address
);

const hasLocation = computed(() => {
  return lng.value !== 0 && lat.value !== 0;
});

const isOpen = ref(false);
</script>
