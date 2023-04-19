<template>
  <div class="search-results-map">
    <Map
      :zoom="10"
      mapStyle="streets"
      :apiKey="config.arcgis.apiKey"
      :center="{ lng: 0, lat: 0 }"
      class=""
    >
      <MapMarker :lng="0" :lat="0" />
    </Map>
  </div>
</template>
<script setup lang="ts">
import Map from "../Map/Map.vue";
import MapMarker from "../MapMarker/MapMarker.vue";
import { FetchStatus, SearchResultMatch } from "@/types";
import config from "@/config";

const props = defineProps<{
  totalResults?: number;
  matches: SearchResultMatch[];
  status: FetchStatus;
}>();

const emits = defineEmits<{
  (event: "loadMore");
}>();
</script>
<style scoped></style>
