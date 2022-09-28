<template>
  <div class="h-screen bg-neutral-300 sm:p-8">
    <article
      class="m-auto sm:max-w-xl bg-white h-full overflow-auto p-4 sm:p-12 rounded shadow sm:px-8 sm:border"
    >
      <h2
        class="text-3xl mb-12 md:text-5xl font-bold py-8 after:content-[''] after:w-8 after:bg-neutral-900 after:h-2 after:block relative after:absolute after:bottom-0 after:left-0"
      >
        {{ assetTitle }}
      </h2>

      <WidgetList :assetId="assetId" />
    </article>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useAssetStore } from "@/stores/assetStore";
import type { Asset } from "@/types";
import { getAssetTitle } from "@/helpers/displayUtils";
import WidgetList from "@/components/WidgetList/WidgetList.vue";

const props = defineProps<{
  assetId: string;
}>();

const asset = ref<Asset | null>(null);
const assetStore = useAssetStore();
const assetTitle = computed(() =>
  asset.value ? getAssetTitle(asset.value) : ""
);

watch(
  () => props.assetId,
  async () => {
    if (!props.assetId) return;
    asset.value = await assetStore.fetchAsset(props.assetId);
  },
  { immediate: true }
);
</script>
<style scoped></style>
