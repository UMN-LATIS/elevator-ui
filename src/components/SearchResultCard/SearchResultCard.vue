<template>
  <Link
    :to="getAssetUrl(searchMatch.objectId)"
    class="group hover:no-underline relative"
  >
    <MediaCard
      :id="`object-${searchMatch.objectId}`"
      :imgSrc="thumbnailImgSrc"
      :imgAlt="title"
      class="search-result-card transition-all max-w-sm flex w-full h-full group-hover:outline outline-blue-600 group-hover:bg-blue-50 group-hover:text-blue-700 relative"
    >
      <Chip
        v-if="searchMatch.fileAssets && searchMatch.fileAssets > 1"
        class="absolute top-1 right-1 z-10 bg-transparent-black-900 text-neutral-200 group-hover:border group-hover:border-blue-700 group-hover:bg-blue-100 group-hover:text-blue-700"
      >
        {{ searchMatch.fileAssets }} files
      </Chip>
      <div ref="cardContents" class="relative h-full">
        <h1
          class="search-result-card__title font-bold leading-tight mb-2 group-hover:text-blue-700"
        >
          {{ title }}
        </h1>
        <div
          v-if="props.searchMatch?.entries"
          class="search-result-card__contents max-h-[15rem] overflow-y-auto overflow-x-hidden"
        >
          <dl class="text-sm group-hover:text-blue-700">
            <div
              v-for="(entry, index) in props.searchMatch.entries"
              :key="index"
              class="mb-2"
            >
              <dt class="font-bold text-xs uppercase">
                {{ entry?.label ?? "Item" }}
              </dt>
              <dd>{{ entry.entries?.join(", ") }}</dd>
            </div>
          </dl>
        </div>
        <ArrowButton
          class="absolute bottom-0 right-0 !transition-all group-hover:opacity-100 opacity-0 !bg-blue-700 !border-blue-700"
        />
      </div>
    </MediaCard>
  </Link>
</template>

<script lang="ts" setup>
import { SearchResultMatch } from "@/types";
import { getAssetUrl, getThumbURL } from "@/helpers/displayUtils";
import { computed, ref } from "vue";
import MediaCard from "../MediaCard/MediaCard.vue";
import Link from "@/components/Link/Link.vue";
import ArrowButton from "../ArrowButton/ArrowButton.vue";
import Chip from "../Chip/Chip.vue";

const props = defineProps<{
  searchMatch: SearchResultMatch;
}>();

const cardContents = ref<HTMLElement | null>(null);

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
}

img {
  max-width: 100%;
}

.hyphens-auto {
  hyphens: auto;
}
</style>
