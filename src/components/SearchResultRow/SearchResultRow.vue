<template>
  <div
    class="search-result-row flex bg-white shadow-md gap-4 max-h-min rounded-2xl"
  >
    <div
      class="placeholder-image bg-neutral-300 max-h-full h-32 aspect-square flex justify-center items-center overflow-hidden rounded-lg border m-2"
    >
      <LazyLoadImage
        v-if="imgSrc"
        :src="imgSrc"
        :alt="title"
        class="w-full h-full object-cover"
      />
    </div>
    <div class="flex-1">
      <h1 class="font-bold text-xl mt-4 mb-2">{{ title }}</h1>

      <dl
        v-if="props.searchMatch?.entries"
        class="inline-flex items-baseline gap-x-4 gap-y-2 flex-wrap m-0"
      >
        <div
          v-for="(entry, index) in props.searchMatch.entries"
          :key="index"
          class="inline-flex items-baseline gap-x-2 flex-wrap"
        >
          <dt class="text-xs text-neutral-400 uppercase">
            {{ entry?.label || "Item" }}
          </dt>
          <dd class="text-sm">
            {{ entry.entries?.join(", ") }}
          </dd>
        </div>
      </dl>
    </div>
    <div class="p-4 flex justify-center items-center">
      <ArrowButton />
    </div>
  </div>
</template>
<script setup lang="ts">
import { SearchResultMatch } from "@/types";
import { getThumbURL } from "@/helpers/displayUtils";
import { computed } from "vue";
import ArrowButton from "../ArrowButton/ArrowButton.vue";
import LazyLoadImage from "../LazyLoadImage/LazyLoadImage.vue";

const props = defineProps<{
  searchMatch: SearchResultMatch;
}>();

const title = computed(() => {
  if (Array.isArray(props.searchMatch.title)) {
    return props.searchMatch.title.join(",");
  }

  if (props.searchMatch.title && props.searchMatch.title.length > 0) {
    return props.searchMatch.title;
  }

  return "(no title)";
});

const imgSrc = computed(() => {
  const { primaryHandlerId } = props.searchMatch;
  return primaryHandlerId ? getThumbURL(primaryHandlerId) : null;
});
</script>
<style scoped></style>
