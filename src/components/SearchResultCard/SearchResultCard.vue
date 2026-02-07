<template>
  <div class="search-result-card relative rounded-lg">
    <RemoveFromDrawerButton
      v-if="drawerId && instanceStore.currentUser?.canManageDrawers"
      class="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 z-10 remove-from-drawer-btn"
      :drawerId="drawerId"
      :objectId="searchMatch.objectId"
      :excerptId="searchMatch.excerptId ?? undefined" />

    <Link :to="excerptUrl ?? assetUrl" class="rounded-md hover:no-underline">
      <MediaCard
        :imgSrc="thumbnailImgSrc"
        :imgAlt="title"
        class="search-result-card__media-card flex w-full h-full relative transition-colors"
        :class="mediaCardClass">
        <div class="absolute top-1 right-1 z-10 flex gap-1">
          <Chip
            v-if="
              !searchMatch.excerpt &&
              searchMatch.fileAssets &&
              searchMatch.fileAssets > 1
            "
            class="!bg-inverse-surface !text-inverse-on-surface border !border-inverse-surface">
            {{ searchMatch.fileAssets }} files
          </Chip>
          <Chip
            v-if="searchMatch.excerpt"
            class="!bg-surface !text-on-surface border !border-surface">
            Excerpt
          </Chip>
        </div>
        <h1 class="search-result-card__title font-bold leading-tight mb-2">
          {{ excerptLabel ?? title }}
        </h1>
        <div
          class="search-result-card__contents max-h-[15rem] overflow-y-auto overflow-x-hidden">
          <dl class="text-sm flex flex-col gap-2">
            <div
              v-for="(entry, index) in props.searchMatch.entries"
              :key="index">
              <dt class="font-bold text-xs uppercase">
                {{ entry?.label ?? "Item" }}
              </dt>
              <dd>{{ entry.entries?.join(", ") }}</dd>
            </div>
            <CollectionHeirarchy
              v-if="instanceStore.instance.showCollectionInSearchResults"
              :collectionHierarchy="props.searchMatch.collectionHierarchy" />
            <div v-if="instanceStore.instance.showTemplateInSearchResults">
              <dt class="font-bold text-xs uppercase">Template</dt>
              <dd>{{ searchMatch.template.name }}</dd>
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
import CollectionHeirarchy from "./CollectionHeirarchy.vue";

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
  const {
    excerptAsset: excerptFileObjectId,
    primaryHandlerThumbnail2x,
    primaryHandlerId,
  } = props.searchMatch;

  if (excerptFileObjectId) {
    return getThumbURL(excerptFileObjectId);
  }

  if (primaryHandlerThumbnail2x) {
    return primaryHandlerThumbnail2x;
  }

  return primaryHandlerId ? getThumbURL(primaryHandlerId) : null;
});
</script>
<style scoped>
.search-result-card:has(.remove-from-drawer-btn:hover) {
  border-color: var(--on-surface);
}

img {
  max-width: 100%;
}

.hyphens-auto {
  hyphens: auto;
}
</style>
