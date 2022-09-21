<template>
  <div class="location-item p-4 bg-transparent-white-800 shadow-sm rounded">
    <p>{{ locationLabel }}</p>
    <div class="my-4 flex gap-4 w-min">
      <Tuple label="Latitude" class="w-auto">{{ latitude || "-" }}</Tuple>
      <Tuple label="Longitude" class="w-auto">{{ longitude || "-" }}</Tuple>
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
      <Tuple label="Latitude" class="w-auto">{{ latitude || "-" }}</Tuple>
      <Tuple label="Longitude" class="w-auto">{{ longitude || "-" }}</Tuple>
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

const latitude = computed(() => {
  return props.locationContent.loc?.coordinates?.[1].toFixed(4) ?? 0;
});

const longitude = computed(() => {
  return props.locationContent.loc?.coordinates?.[0].toFixed(4) ?? 0;
});

const mapCenter = computed(
  () =>
    ({
      lng: longitude.value,
      lat: latitude.value,
    } as LngLat)
);

const locationLabel = computed(() => {
  let label = "";
  if (
    props.locationContent.locationLabel &&
    props.locationContent.locationLabel.length > 0
  ) {
    label = props.locationContent.locationLabel;
  } else {
    if (
      props.locationContent.address &&
      props.locationContent.address.length > 0
    ) {
      label = props.locationContent.address;
    } else {
      label = latitude.value + ", " + longitude.value;
    }
  }
  return label;
});

const hasLocation = computed(() => {
  return longitude.value !== 0 && latitude.value !== 0;
});

const isOpen = ref(false);
</script>
