<template>
  <div
    class="relative search-result-card border-2 border-transparent rounded-lg"
  >
    <RemoveFromDrawerButton
      v-if="drawerId && instanceStore.currentUser?.canManageDrawers"
      class="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 z-10 remove-from-drawer-btn"
      :drawerId="drawerId"
      :objectId="searchMatch.objectId"
    />

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
        <div class="flex justify-end">
          <AddToDrawerButton
            v-if="instanceStore.currentUser?.canManageDrawers"
            :objectId="searchMatch.objectId"
          />
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
import { useInstanceStore } from "@/stores/instanceStore";
import RemoveFromDrawerButton from "@/components/RemoveFromDrawerButton/RemoveFromDrawerButton.vue";

const props = defineProps<{
  searchMatch: SearchResultMatch;
  drawerId?: number;
}>();

const instanceStore = useInstanceStore();

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
