<template>
  <div
    class="asset-view-page__meta-data-only-view h-full relative bg-surface-container">
    <div class="meta-data-only-view__inner h-full sm:p-8">
      <article
        class="meta-data-only-view__article bg-surface m-auto sm:max-w-3xl h-full overflow-auto p-4 sm:p-12 rounded shadow-md sm:px-12">
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

        <AssetMetadata :assetId="assetId" />
      </article>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { getAssetTitle } from "@/helpers/displayUtils";
import { useAsset } from "@/helpers/useAsset";
import { useInstanceStore } from "@/stores/instanceStore";
import IconButton from "@/components/IconButton/IconButton.vue";
import { PencilIcon } from "lucide-vue-next";
import AssetMetadata from "@/components/AssetMetadata/AssetMetadata.vue";

const props = defineProps<{
  assetId: string | null;
}>();

const assetIdRef = computed(() => props.assetId);
const { asset } = useAsset(assetIdRef);
const assetTitle = computed(() =>
  asset.value ? getAssetTitle(asset.value) : "Unknown"
);
const instanceStore = useInstanceStore();
</script>
<style scoped></style>
