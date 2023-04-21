<template>
  <div class="search-results-map">
    <Map
      :zoom="10"
      mapStyle="streets"
      :apiKey="config.arcgis.apiKey"
      :bounds="boundingBox"
      :center="center"
      class=""
    >
      <MapMarker
        v-for="marker in markers"
        :id="marker.id"
        :key="marker.id"
        :lng="marker.lng"
        :lat="marker.lat"
      >
        <MapPopup>
          <LazyLoadImage
            v-if="marker.imgSrc"
            :src="marker.imgSrc"
            :alt="marker.title"
            class="h-8 w-8 sm:h-16 sm:w-16 object-cover rounded-md overflow-hidden"
          />
          <h1>{{ marker.title }}</h1>

          <dl
            v-if="marker.entries"
            class="inline-flex items-baseline gap-x-4 sm:gap-y-2 flex-wrap m-0"
          >
            <div
              v-for="(entry, index) in marker.entries"
              :key="index"
              class="inline-flex items-baseline gap-x-2 flex-wrap text-neutral-400 group-hover:text-blue-700 group-focus:text-blue-700"
            >
              <dt class="text-xs uppercase">
                {{ entry?.label || "Item" }}
              </dt>
              <dd class="text-sm">
                {{ entry.entries?.join(", ") }}
              </dd>
            </div>
          </dl>
        </MapPopup>
      </MapMarker>
    </Map>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import Map from "@/components/Map/Map.vue";
import MapMarker from "@/components/MapMarker/MapMarker.vue";
import MapPopup from "@/components/MapPopup/MapPopup.vue";
import {
  BoundingBox,
  FetchStatus,
  SearchResultMatch,
  SearchResultMatchEntry,
  LngLat,
} from "@/types";
import { convertSearchResultToLngLats } from "@/helpers/mapResultsHelpers";
import { getAssetUrl, getThumbURL } from "@/helpers/displayUtils";
import config from "@/config";
import LazyLoadImage from "../LazyLoadImage/LazyLoadImage.vue";
import getBoundingBox from "@/components/Map/getBoundingBox";
import { getCenterOfBoundingBox } from "../Map/getCenterOfBoundingBox";

const props = defineProps<{
  totalResults?: number;
  matches: SearchResultMatch[];
  status: FetchStatus;
}>();

interface SearchResultMapMarker {
  id: string;
  assetUrl: string;
  title: string;
  imgSrc: string;
  entries: SearchResultMatchEntry[];
  lat: number;
  lng: number;
}

function getMatchTitle(match: SearchResultMatch): string {
  if (typeof match.title === "string") return match.title;
  if (Array.isArray(match.title) && match.title.length > 0)
    return match.title[0];
  return "(No Title)";
}

const markers = computed((): SearchResultMapMarker[] => {
  return props.matches.reduce((acc, match) => {
    if (!match.primaryHandlerId) return acc;

    const assetUrl = getAssetUrl(match.primaryHandlerId);
    const imgSrc = getThumbURL(match.primaryHandlerId);
    const title = getMatchTitle(match);
    const lngLats = convertSearchResultToLngLats(match);

    const markersForThisMatch = lngLats.map((lngLat) => ({
      id: `${match.objectId}-${lngLat.lng}-${lngLat.lat}`,
      assetUrl,
      title,
      imgSrc,
      entries: match.entries ?? [],
      ...lngLat,
    }));

    return acc.concat(markersForThisMatch);
  }, [] as SearchResultMapMarker[]);
});

const boundingBox = computed((): BoundingBox => {
  const lnglats = markers.value.map((marker) => ({
    lng: marker.lng,
    lat: marker.lat,
  }));
  return getBoundingBox(lnglats);
});

const center = computed((): LngLat => {
  return getCenterOfBoundingBox(boundingBox.value);
});

const emits = defineEmits<{
  (event: "loadMore");
}>();
</script>
<style scoped></style>
