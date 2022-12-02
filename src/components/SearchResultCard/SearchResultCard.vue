<template>
  <MediaCard
    :imgSrc="thumbnailImgSrc"
    :imgAlt="title"
    class="search-result-card hover:shadow-lg transition-shadow max-w-sm"
  >
    <div class="relative h-full pb-16">
      <Link :to="getAssetUrl(searchMatch.objectId)"
        ><h1 class="search-result-card__title text-xl font-bold">
          {{ title }}
        </h1>
      </Link>
      <div
        v-if="props.searchMatch?.entries"
        class="search-result-card__contents"
      >
        <template
          v-for="(entry, index) in props.searchMatch.entries"
          :key="index"
        >
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
</template>

<script lang="ts" setup>
import { SearchResultMatch } from "@/types";
import { getAssetUrl, getThumbURL } from "@/helpers/displayUtils";
import { computed } from "vue";
import MediaCard from "../MediaCard/MediaCard.vue";
import ArrowButton from "../ArrowButton/ArrowButton.vue";
import Link from "@/components/Link/Link.vue";
import Tuple from "../Tuple/Tuple.vue";

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
