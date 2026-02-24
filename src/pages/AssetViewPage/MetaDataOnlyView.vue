<template>
  <div class="asset-view-page__meta-data-only-view h-full relative">
    <div class="meta-data-only-view__inner h-full sm:p-8">
      <article
        class="meta-data-only-view__article bg-surface-container m-auto sm:max-w-3xl h-full overflow-auto p-4 sm:p-12 rounded shadow-md sm:px-12">
        <header class="flex justify-between items-baseline">
          <h2
            class="text-3xl mb-12 sm:text-5xl font-bold after:content-[''] after:w-8 after:h-2 after:block relative after:absolute after:bottom-0 after:left-0 after:bg-on-surface pb-8">
            {{ assetTitle || "(No Title)" }}
          </h2>
          <IconButton
            v-if="assetId && instanceStore.currentUser?.canManageAssets"
            :to="`/assetManager/editAsset/${assetId}`"
            title="Edit Asset">
            <span class="sr-only">Edit Asset</span>
            <PencilIcon class="size-4" />
          </IconButton>
        </header>

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
import { useInstanceStore } from "@/stores/instanceStore";
import IconButton from "@/components/IconButton/IconButton.vue";
import { PencilIcon } from "lucide-vue-next";

const props = defineProps<{
  assetId: string | null;
}>();

const assetIdRef = computed(() => props.assetId);
const { asset } = useAsset(assetIdRef);
const assetTitle = computed(() =>
  asset.value ? getAssetTitle(asset.value) : "Unknown"
);
const moreLikeThisItems = ref<SearchResultMatch[]>([]);
const instanceStore = useInstanceStore();

watch(
  assetIdRef,
  async () => {
    moreLikeThisItems.value = await api.getMoreLikeThis(assetIdRef.value);
  },
  { immediate: true }
);
</script>
<style scoped></style>
