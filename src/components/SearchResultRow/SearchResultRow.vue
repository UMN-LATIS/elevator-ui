<template>
  <Link
    :to="getAssetUrl(searchMatch.objectId)"
    class="group hover:no-underline relative"
  >
    <div class="search-result-row flex bg-white p-4 gap-4">
      <LazyLoadImage
        v-if="imgSrc"
        :src="imgSrc"
        :alt="title"
        class="h-16 w-16 object-cover rounded-md overflow-hidden"
      />
      <div v-else class="h-16 w-16" />
      <div class="flex-1">
        <h1 class="font-bold text-lg leading-tight mb-2">{{ title }}</h1>

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
    </div>
  </Link>
</template>
<script setup lang="ts">
import { SearchResultMatch } from "@/types";
import { getThumbURL } from "@/helpers/displayUtils";
import { computed } from "vue";
import LazyLoadImage from "../LazyLoadImage/LazyLoadImage.vue";
import Link from "../Link/Link.vue";
import { getAssetUrl } from "@/helpers/displayUtils";

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
