<template>
  <div class="relative search-result-card rounded-lg">
    <RemoveFromDrawerButton
      v-if="drawerId && instanceStore.currentUser?.canManageDrawers"
      class="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 z-10 remove-from-drawer-btn"
      :drawerId="drawerId"
      :objectId="searchMatch.objectId"
      :excerptId="searchMatch.excerptId ?? undefined"
    />

    <Link :to="excerptUrl ?? assetUrl" class="rounded-md hover:no-underline">
      <MediaCard
        :imgSrc="thumbnailImgSrc"
        :imgAlt="title"
        class="search-result-card flex w-full h-full relative transition-colors"
        :class="mediaCardClass"
      >
        <div class="absolute top-1 right-1 z-10 flex gap-1">
          <Chip
            v-if="
              !searchMatch.excerpt &&
              searchMatch.fileAssets &&
              searchMatch.fileAssets > 1
            "
            class="!bg-neutral-900 !text-neutral-200 border !border-neutral-900"
          >
            {{ searchMatch.fileAssets }} files
          </Chip>
          <Chip
            v-if="searchMatch.excerpt"
            class="!bg-neutral-50 !text-neutral-900 border !border-neutral-50"
          >
            Excerpt
          </Chip>
        </div>
        <h1 class="search-result-card__title font-bold leading-tight mb-2">
          {{ excerptLabel ?? title }}
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
      </MediaCard>
    </Link>
  </div>
</template>

<script lang="ts" setup>
import { SearchResultMatch } from "@/types";
import {
  getAssetUrl,
  getThumbURL,
  convertHtmlToText,
} from "@/helpers/displayUtils";
import { computed } from "vue";
import MediaCard from "@/components/MediaCard/MediaCard.vue";
import Link from "@/components/Link/Link.vue";
import Chip from "@/components/Chip/Chip.vue";
import { useInstanceStore } from "@/stores/instanceStore";
import RemoveFromDrawerButton from "@/components/RemoveFromDrawerButton/RemoveFromDrawerButton.vue";

const props = defineProps<{
  searchMatch: SearchResultMatch;
  drawerId?: number;
  mediaCardClass?: string | string[] | Record<string, boolean>;
}>();

const instanceStore = useInstanceStore();

const excerptUrl = computed((): string | null => {
  if (!props.searchMatch.excerpt) return null;

  if (!props.searchMatch.excerptId) {
    throw new Error("Excerpt is missing excerptId");
  }

  return `/asset/viewExcerpt/${props.searchMatch.excerptId}`;
});

const excerptLabel = computed(() => {
  if (!props.searchMatch.excerpt) return null;

  return props.searchMatch.excerptLabel;
});

const assetUrl = computed(() => getAssetUrl(props.searchMatch.objectId));

const title = computed(() => {
  if (Array.isArray(props.searchMatch.title)) {
    return props.searchMatch.title
      .map((str) => convertHtmlToText(str))
      .join(",");
  }

  if (props.searchMatch.title && props.searchMatch.title.length > 0) {
    return convertHtmlToText(props.searchMatch.title);
  }

  return "(no title)";
});

const thumbnailImgSrc = computed(() => {
  const { excerptAsset: excerptFileObjectId, primaryHandlerThumbnail2x } =
    props.searchMatch;
  if (excerptFileObjectId) return getThumbURL(excerptFileObjectId);
  return primaryHandlerThumbnail2x ?? null;
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
