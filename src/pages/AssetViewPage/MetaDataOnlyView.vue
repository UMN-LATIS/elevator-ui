<template>
  <div class="h-full bg-neutral-300 sm:p-8">
    <article
      class="m-auto sm:max-w-3xl bg-white h-full overflow-auto p-4 sm:p-12 rounded shadow sm:px-8"
    >
      <h2
        class="text-3xl mb-12 sm:text-5xl font-bold py-8 after:content-[''] after:w-8 after:bg-neutral-900 after:h-2 after:block relative after:absolute after:bottom-0 after:left-0"
      >
        {{ assetTitle }}
      </h2>

      <WidgetList v-if="assetId" :assetId="assetId" />
    </article>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { getAssetTitle } from "@/helpers/displayUtils";
import WidgetList from "@/components/WidgetList/WidgetList.vue";
import { useAsset } from "@/helpers/useAsset";

const props = defineProps<{
  assetId: string | null;
}>();

const assetIdRef = computed(() => props.assetId);
const { asset } = useAsset(assetIdRef);
const assetTitle = computed(() =>
  asset.value ? getAssetTitle(asset.value) : "Unknown"
);
</script>
