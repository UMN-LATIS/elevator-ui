<template>
  <div
    class="relative search-result-card border-2 border-transparent rounded-lg"
  >
    <button
      v-if="showRemoveButton"
      class="bg-white w-6 h-6 text-neutral-300 inline-flex justify-center items-center absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 z-10 rounded-full shadow-sm hover:bg-neutral-900 hover:text-neutral-200 remove-from-drawer-btn transition-all"
      title="Remove"
      @click="$emit('remove')"
    >
      <span class="sr-only">Remove</span>
      &times;
    </button>
    <MediaCard
      :imgSrc="thumbnailImgSrc"
      :imgAlt="title"
      :to="assetUrl"
      class="search-result-card flex w-full h-full relative transition-colors"
    >
      <Chip
        v-if="searchMatch.fileAssets && searchMatch.fileAssets > 1"
        class="absolute top-1 right-1 z-10 !bg-neutral-900 !text-neutral-200 border !border-neutral-900"
      >
        {{ searchMatch.fileAssets }} files
      </Chip>
      <h1 class="search-result-card__title font-bold leading-tight mb-2">
        {{ title }}
      </h1>
      <div
        v-if="props.searchMatch?.entries"
        class="search-result-card__contents max-h-[15rem] overflow-y-auto overflow-x-hidden"
      >
        <dl class="text-sm">
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
      <template #footer>
        <div v-if="showAddToDrawerButton" class="flex justify-end">
          <AddToDrawerButton :objectId="searchMatch.objectId" />
        </div>
      </template>
    </MediaCard>
  </div>
</template>

<script lang="ts" setup>
import { SearchResultMatch } from "@/types";
import { getAssetUrl, getThumbURL, stripTags } from "@/helpers/displayUtils";
import { computed } from "vue";
import MediaCard from "../MediaCard/MediaCard.vue";
import Chip from "../Chip/Chip.vue";
import AddToDrawerButton from "../AddToDrawerButton/AddToDrawerButton.vue";

const props = withDefaults(
  defineProps<{
    searchMatch: SearchResultMatch;
    showRemoveButton?: boolean;
    showAddToDrawerButton?: boolean;
  }>(),
  {
    showRemoveButton: false,
    showAddToDrawerButton: false,
  }
);

defineEmits<{
  (eventName: "remove"): void;
}>();

const assetUrl = computed(() => getAssetUrl(props.searchMatch.objectId));

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
.search-result-card:has(.remove-from-drawer-btn:hover) {
  border-color: var(--neutral-900);
}

img {
  max-width: 100%;
}

.hyphens-auto {
  hyphens: auto;
}
</style>
