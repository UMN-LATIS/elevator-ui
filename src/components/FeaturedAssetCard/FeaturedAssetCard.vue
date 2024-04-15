<template>
  <Link
    :to="getAssetUrl(assetId)"
    class="featured-asset-card group hover:no-underline relative">
    <Transition name="fade">
      <article
        v-if="asset"
        class="media-card flex flex-col overflow-hidden rounded-md shadow-sm max-w-xs group-hover:border-blue-700">
        <div
          class="placeholder-image aspect-video flex items-center justify-center w-full overflow-hidden bg-transparent-black-200 p-4">
          <LazyLoadImage
            v-if="imgSrc"
            :src="imgSrc"
            :alt="title || 'Untitled'"
            loading="lazy"
            class="object-contain w-full h-full !bg-transparent" />
          <DocumentIcon v-else />
        </div>
        <div class="flex-1 p-4 flex justify-between items-center">
          <h1
            class="search-result-card__title font-bold leading-tight group-hover:text-blue-700 text-center">
            <SanitizedHTML :html="title" />
          </h1>
          <ArrowForwardIcon class="group-hover:text-blue-700" />
        </div>
      </article>
    </Transition>
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
import SanitizedHTML from "@/components/SanitizedHTML/SanitizedHTML.vue";
import LazyLoadImage from "@/components/LazyLoadImage/LazyLoadImage.vue";
import { DocumentIcon, ArrowForwardIcon } from "@/icons";
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

.media-card {
  background: var(--app-mediaCard-backgroundColor);
  color: var(--app-mediaCard-textColor);
  border: var(--app-mediaCard-borderWidth) solid
    var(--app-mediaCard-borderColor);
}

img {
  max-width: 100%;
}

.hyphens-auto {
  hyphens: auto;
}
</style>
