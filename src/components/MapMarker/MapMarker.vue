<template>
  <div class="map-marker">
    <slot></slot>
  </div>
</template>
<script setup lang="ts">
import { type Ref, onMounted, onUnmounted } from "vue";
import { inject, provide } from "vue";
import { MapInjectionKey, MarkerInjectionKey } from "@/constants/mapConstants";
import { MapContext, MarkerContext } from "@/types";

const props = defineProps<{
  id: string;
  lng: number;
  lat: number;
}>();

const mapContext = inject<MapContext>(MapInjectionKey);

onMounted(() => {
  if (!mapContext) {
    throw new Error(
      `Cannot add marker ${props.id} for [${props.lng}, ${props.lat}]. Map context is null.`
    );
  }

  mapContext.createOrUpdateMarker({
    id: props.id,
    lng: props.lng,
    lat: props.lat,
  });
});

onUnmounted(() => {
  if (!mapContext) {
    throw new Error(
      `Cannot remove marker ${props.id} for [${props.lng}, ${props.lat}]. Map context is null.`
    );
  }

  mapContext.removeMarker(props.id);
});

function createPopup(popupContainerRef: Ref<HTMLElement | null>) {
  if (!mapContext) {
    throw new Error(
      `Cannot create popup for marker ${props.id} for [${props.lng}, ${props.lat}]. Map context is null.`
    );
  }

  mapContext.setMarkerPopupContainer(props.id, popupContainerRef);
}

function removePopup() {
  if (!mapContext) {
    throw new Error(
      `Cannot remove popup for marker ${props.id} for [${props.lng}, ${props.lat}]. Map context is null.`
    );
  }

  mapContext.removeMarkerPopup(props.id);
}

provide<MarkerContext>(MarkerInjectionKey, {
  createPopup,
  removePopup,
});
</script>
