<template>
  <Link
    :to="getAssetUrl(searchMatch.objectId)"
    class="search-result-row group hover:no-underline relative text-inherit group focus:outline-m3-primary focus:outline-offset-2 focus-within:outline-solid search-result-row flex bg-white p-2 sm:p-4 gap-4 group-hover:bg-m3-primary-container transition-all rounded-md border-2 border-transparent hover:border-m3-primary group-focus:bg-m3-primary-container group-focus:border-m3-primary items-center">
    <LazyLoadImage
      v-if="imgSrc"
      :src="imgSrc"
      :alt="title"
      class="h-8 w-8 sm:h-16 sm:w-16 app-object-fit rounded-md overflow-hidden" />
    <div v-else class="h-8 w-8 sm:h-16 sm:w-16" />
    <div class="flex-1">
      <h1
        class="font-bold text-md sm:text-lg leading-tight sm:mb-2 group-hover:text-m3-primary group-focus:text-m3-primary">
        {{ title }}
      </h1>

      <dl
        v-if="props.searchMatch?.entries"
        class="inline-flex items-baseline gap-x-4 sm:gap-y-2 flex-wrap m-0">
        <div
          v-for="(entry, index) in props.searchMatch.entries"
          :key="index"
          class="inline-flex items-baseline gap-x-2 flex-wrap text-on-surface-variant group-hover:text-m3-primary group-focus:text-m3-primary">
          <dt class="text-xs uppercase">
            {{ entry?.label || "Item" }}
          </dt>
          <dd class="text-sm">
            {{ entry.entries?.join(", ") }}
          </dd>
        </div>
      </dl>
    </div>
    <div
      class="not-sr-only hidden sm:inline-flex self-center rounded-full w-10 h-10 items-center justify-center group-hover:bg-m3-primary transition-all">
      <ArrowForwardIcon
        class="text-on-surface group-hover:text-white transition-all" />
    </div>
  </Link>
</template>
<script setup lang="ts">
import { SearchResultMatch } from "@/types";
import { getThumbURL, convertHtmlToText } from "@/helpers/displayUtils";
import { computed } from "vue";
import LazyLoadImage from "../LazyLoadImage/LazyLoadImage.vue";
import Link from "../Link/Link.vue";
import { getAssetUrl } from "@/helpers/displayUtils";
import { ArrowForwardIcon } from "@/icons";

const props = defineProps<{
  searchMatch: SearchResultMatch;
}>();

const title = computed(() => {
  if (Array.isArray(props.searchMatch.title)) {
    return props.searchMatch.title.map(convertHtmlToText).join(",");
  }

  if (props.searchMatch.title && props.searchMatch.title.length > 0) {
    return convertHtmlToText(props.searchMatch.title);
  }

  return "(no title)";
});

const imgSrc = computed(() => {
  const { primaryHandlerId } = props.searchMatch;
  return primaryHandlerId ? getThumbURL(primaryHandlerId) : null;
});
</script>
<style scoped></style>
