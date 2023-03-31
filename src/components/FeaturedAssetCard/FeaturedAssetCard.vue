<template>
  <Link :to="getAssetUrl(assetId)" class="group hover:no-underline relative">
    <article
      class="media-card flex flex-col overflow-hidden border rounded-md shadow-sm"
    >
      <div
        class="placeholder-image aspect-video flex items-center justify-center w-full overflow-hidden bg-transparent-black-200 p-4"
      >
        <LazyLoadImage
          v-if="imgSrc"
          :src="imgSrc"
          :alt="title || 'Untitled'"
          loading="lazy"
          class="object-contain w-full h-full !bg-transparent"
        />
        <DocumentIcon v-else />
      </div>
      <div class="flex-1 p-4">
        <div ref="cardContents" class="relative h-full">
          <h1
            class="search-result-card__title font-bold leading-tight mb-2 group-hover:text-blue-700"
          >
            <SanitizedHTML :html="title" />
          </h1>
          <ArrowButton
            class="absolute bottom-0 right-0 !transition-all group-hover:opacity-100 opacity-0 !bg-blue-700 !border-blue-700"
          />
        </div>
      </div>
    </article>
  </Link>
</template>

<script lang="ts" setup>
import { Asset } from "@/types";
import {
  getAssetUrl,
  getThumbURL,
  getAssetTitle,
} from "@/helpers/displayUtils";
import { computed, ref, watch } from "vue";
import Link from "@/components/Link/Link.vue";
import ArrowButton from "@/components/ArrowButton/ArrowButton.vue";
import SanitizedHTML from "@/components/SanitizedHTML/SanitizedHTML.vue";
import LazyLoadImage from "@/components/LazyLoadImage/LazyLoadImage.vue";
import { DocumentIcon } from "@/icons";
import api from "@/api";

const props = defineProps<{
  assetId: string;
}>();

const asset = ref<Asset | null>(null);

watch(
  () => props.assetId,
  async () => {
    asset.value = await api.getAsset(props.assetId);
  },
  { immediate: true }
);

const title = computed(() => {
  if (!asset.value) return "";
  return getAssetTitle(asset.value);
});

const imgSrc = computed((): string | null => {
  const fileHandlerId = asset.value?.firstFileHandlerId ?? null;
  return fileHandlerId ? getThumbURL(fileHandlerId) : null;
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