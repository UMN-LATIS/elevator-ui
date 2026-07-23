<template>
  <Accordion>
    <template #label>
      <div v-if="!locationLabel" class="flex gap-4 p-4 pr-0 flex-wrap">
        <Tuple label="Lat" class="w-auto" variant="inline">{{ latStr }}</Tuple>
        <Tuple label="Lng" class="w-auto" variant="inline">{{ lngStr }}</Tuple>
      </div>
      <span v-else class="p-4">{{ locationLabel }}</span>
    </template>
    <div v-if="locationLabel" class="w-min flex gap-4 my-4">
      <Tuple label="Latitude" class="w-auto">{{ latStr }}</Tuple>
      <Tuple label="Longitude" class="w-auto">{{ lngStr }}</Tuple>
    </div>
    <Button
      v-if="hasLocation"
      icon="map"
      iconPosition="start"
      @click="isOpen = true">
      Show Location
    </Button>
  </Accordion>

  <Modal :isOpen="isOpen" :label="locationLabel" @close="isOpen = false">
    <Map
      v-if="lngLat"
      :center="lngLat"
      :zoom="10"
      mapStyle="streets"
      :apiKey="config.arcgis.apiKey"
      class="p-1 rounded"
      mapContainerClass="!h-[50vh]">
      <MapMarker
        :id="`locationItem-${locationLabel}`"
        :lng="lngLat.lng"
        :lat="lngLat.lat" />
    </Map>
    <div class="w-min flex gap-4 my-4">
      <Tuple label="Latitude" class="w-auto">{{ latStr }}</Tuple>
      <Tuple label="Longitude" class="w-auto">{{ lngStr }}</Tuple>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { LocationWidgetDef, LocationWidgetContent, LngLat } from "@/types";
import { computed, ref, defineAsyncComponent } from "vue";
import Modal from "@/components/Modal/Modal.vue";
import config from "@/config";
import Tuple from "@/components/Tuple/Tuple.vue";
import Button from "@/components/Button/Button.vue";
import Accordion from "@/components/Accordion/Accordion.vue";
import { toLngLat } from "@/helpers/coordinates";

const Map = defineAsyncComponent(() => import("@/components/Map/Map.vue"));
const MapMarker = defineAsyncComponent(
  () => import("@/components/MapMarker/MapMarker.vue")
);

interface Props {
  locationContent: LocationWidgetContent;
  widget: LocationWidgetDef;
}

const props = defineProps<Props>();

// (0,0) doubles as "no location" in stored data, treat it as absent
const lngLat = computed((): LngLat | null => {
  const stored = toLngLat(props.locationContent.loc?.coordinates);
  const isZeroLngLat = stored?.lng === 0 && stored?.lat === 0;
  return isZeroLngLat ? null : stored;
});

const lngStr = computed((): string =>
  lngLat.value ? lngLat.value.lng.toFixed(4) : "-"
);
const latStr = computed((): string =>
  lngLat.value ? lngLat.value.lat.toFixed(4) : "-"
);

const locationLabel = computed(
  () =>
    (props.locationContent.locationLabel || props.locationContent.address) ??
    null
);

const hasLocation = computed(() => lngLat.value !== null);

const isOpen = ref(false);
</script>
