<template>
  <Link
    :to="getAssetUrl(searchMatch.objectId)"
    class="group hover:no-underline relative"
  >
    <MediaCard
      :imgSrc="thumbnailImgSrc"
      :imgAlt="title"
      class="search-result-card flex w-full h-full group-hover:bg-blue-50 group-hover:border-blue-700 group-hover:outline-offset-2 group-hover:text-blue-700 relative transition-colors"
    >
      <Chip
        v-if="searchMatch.fileAssets && searchMatch.fileAssets > 1"
        class="absolute top-1 right-1 z-10 !bg-neutral-900 !text-neutral-200 border !border-neutral-900 group-hover:!border-blue-700 group-hover:!bg-blue-100 group-hover:!text-blue-700 transition-colors"
      >
        {{ searchMatch.fileAssets }} files
      </Chip>
      <div ref="cardContents" class="relative h-full">
        <h1
          class="search-result-card__title font-bold leading-tight mb-2 group-hover:text-blue-700 transition-colors"
        >
          {{ title }}
        </h1>
        <div
          v-if="props.searchMatch?.entries"
          class="search-result-card__contents max-h-[15rem] overflow-y-auto overflow-x-hidden"
        >
          <dl class="text-sm group-hover:text-blue-700 transition-colors">
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
          class="absolute w-10 h-10 bottom-0 right-0 inline-flex justify-center items-center rounded-full group-hover:!bg-blue-700 group-hover:!text-white transition-colors"
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
import { getAssetUrl, getThumbURL, stripTags } from "@/helpers/displayUtils";
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
    return props.searchMatch.title.map((str) => stripTags(str)).join(",");
  }

  if (props.searchMatch.title && props.searchMatch.title.length > 0) {
    return stripTags(props.searchMatch.title);
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
