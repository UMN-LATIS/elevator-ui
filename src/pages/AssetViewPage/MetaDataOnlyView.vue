<template>
  <div class="asset-view-page__meta-data-only-view h-full relative">
    <div class="meta-data-only-view__inner h-full sm:p-8">
      <article
        class="meta-data-only-view__article m-auto sm:max-w-3xl h-full overflow-auto p-4 sm:p-12 rounded shadow sm:px-12">
        <h2
          class="text-3xl mb-12 sm:text-5xl font-bold py-8 after:content-[''] after:w-8 after:h-2 after:block relative after:absolute after:bottom-0 after:left-0">
          {{ assetTitle || "(No Title)" }}
        </h2>

        <WidgetList v-if="assetId" :assetId="assetId" />
        <MoreLikeThis
          v-if="assetId"
          :items="moreLikeThisItems"
          listContainerClass="sm:!grid sm:!grid-cols-2" />
      </article>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { getAssetTitle } from "@/helpers/displayUtils";
import WidgetList from "@/components/WidgetList/WidgetList.vue";
import { useAsset } from "@/helpers/useAsset";
import { SearchResultMatch } from "@/types";
import MoreLikeThis from "@/components/MoreLikeThis/MoreLikeThis.vue";
import api from "@/api";

const props = defineProps<{
  assetId: string | null;
}>();

const assetIdRef = computed(() => props.assetId);
const { asset } = useAsset(assetIdRef);
const assetTitle = computed(() =>
  asset.value ? getAssetTitle(asset.value) : "Unknown"
);
const moreLikeThisItems = ref<SearchResultMatch[]>([]);

watch(
  assetIdRef,
  async () => {
    moreLikeThisItems.value = await api.getMoreLikeThis(assetIdRef.value);
  },
  { immediate: true }
);
</script>
<style scoped>
.meta-data-only-view__inner {
  background: var(--app-metaDataOnlyView-backgroundColor);
}
.meta-data-only-view__article {
  background: var(--app-metaDataOnlyView-contentViewer-backgroundColor);
  color: var(--app-metaDataOnlyView-contentViewer-textColor);
}

.meta-data-only-view__article h2:after {
  background: var(--app-metaDataOnlyView-contentViewer-textColor);
}
</style>
