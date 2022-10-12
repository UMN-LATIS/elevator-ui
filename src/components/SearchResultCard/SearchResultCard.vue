<template>
  <MediaCard
    :imgSrc="thumbnailImgSrc"
    :imgAlt="title"
    class="hover:shadow-lg transition-shadow"
  >
    <div class="h-full pb-16 relative">
      <h1 class="font-bold text-xl mb-2">{{ title }}</h1>
      <dl v-if="props.searchMatch?.entries" class="grid gap-3">
        <template
          v-for="(entry, index) in props.searchMatch.entries"
          :key="index"
        >
          <div>
            <dt
              class="text-xs text-neutral-400 uppercase col-span-1 flex items-start justify-start hyphens"
            >
              {{ entry?.label || "Item" }}
            </dt>
            <dd class="text-sm col-span-2">
              {{ entry.entries?.join(", ") }}
            </dd>
          </div>
        </template>
      </dl>
      <ArrowButton
        :href="getAssetUrl(searchMatch.objectId)"
        class="absolute bottom-0 right-0"
      />
    </div>
  </MediaCard>
</template>

<script lang="ts" setup>
import { SearchResultMatch } from "@/types";
import { getAssetUrl, getThumbURL } from "@/helpers/displayUtils";
import { computed } from "vue";
import MediaCard from "../MediaCard/MediaCard.vue";
import ArrowButton from "../ArrowButton/ArrowButton.vue";

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

const thumbnailImgSrc = computed(() => {
  const { primaryHandlerId } = props.searchMatch;
  return primaryHandlerId ? getThumbURL(primaryHandlerId) : null;
});
</script>

<style scoped>
img {
  max-width: 100%;
}

.hyphens-auto {
  hyphens: auto;
}
</style>
