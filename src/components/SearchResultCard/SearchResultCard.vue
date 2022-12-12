<template>
  <Link
    :to="getAssetUrl(searchMatch.objectId)"
    class="relative group hover:no-underline"
  >
    <MediaCard
      :imgSrc="thumbnailImgSrc"
      :imgAlt="title"
      class="search-result-card group-hover:shadow-lg transition-all max-w-sm flex w-full h-full"
    >
      <div class="relative h-full pb-16">
        <h1 class="search-result-card__title text-xl font-bold">
          {{ title }}
        </h1>
        <div
          v-if="props.searchMatch?.entries"
          class="search-result-card__contents"
        >
          <template v-for="(entry, index) in detailsToShow" :key="index">
            <Tuple :label="entry?.label ?? 'Item'">
              <span class="text-sm"> {{ entry.entries?.join(", ") }}</span>
            </Tuple>
          </template>
        </div>
        <ArrowButton
          :to="getAssetUrl(searchMatch.objectId)"
          class="absolute bottom-0 right-0"
        />
      </div>
    </MediaCard>
  </Link>
</template>

<script lang="ts" setup>
import { SearchResultMatch } from "@/types";
import { getAssetUrl, getThumbURL } from "@/helpers/displayUtils";
import { computed } from "vue";
import MediaCard from "../MediaCard/MediaCard.vue";
import ArrowButton from "../ArrowButton/ArrowButton.vue";
import Link from "@/components/Link/Link.vue";
import Tuple from "../Tuple/Tuple.vue";

const props = withDefaults(
  defineProps<{
    searchMatch: SearchResultMatch;
    maxNumberOfDetails?: number;
  }>(),
  {
    maxNumberOfDetails: 2,
  }
);

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

const detailsToShow = computed(() => {
  if (!props.searchMatch.entries) return [];

  return props.searchMatch.entries.slice(0, props.maxNumberOfDetails);
});
</script>
<style scoped>
.search-result-card__title {
  color: var(--app-mediaCard-title-textColor);
  margin-bottom: var(--app-panel-body-items-gap);
}

.search-result-card__contents {
  display: flex;
  flex-direction: column;
  gap: var(--app-panel-body-items-gap);
}

img {
  max-width: 100%;
}

.hyphens-auto {
  hyphens: auto;
}
</style>
