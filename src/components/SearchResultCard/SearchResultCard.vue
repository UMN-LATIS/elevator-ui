<template>
  <Link
    :to="getAssetUrl(searchMatch.objectId)"
    class="group hover:no-underline relative"
  >
    <MediaCard
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
        <div
          class="absolute right-2 bottom-2 bg-transparent-black-100 w-10 h-10 inline-flex justify-center items-center rounded-full group-hover:!bg-blue-700 group-hover:!text-white"
        >
          <ArrowForwardIcon />
          <span class="sr-only">View Asset</span>
        </div>
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
import Chip from "../Chip/Chip.vue";
import { ArrowForwardIcon } from "@/icons";

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
