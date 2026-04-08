<template>
  <section
    v-if="asset"
    class="collapsed-inline-related-asset-widget-item flex flex-col w-full">
    <div class="flex justify-between items-baseline">
      <h3>{{ title }}</h3>
      <Button :to="`/asset/viewAsset/${assetId}`" variant="tertiary">
        View
        <ArrowRightIcon class="size-4" />
      </Button>
    </div>
    <WidgetList :assetId="assetId" />
  </section>
</template>
<script setup lang="ts">
import WidgetList from "@/components/WidgetList/WidgetList.vue";
import { computed } from "vue";
import { useAsset } from "@/helpers/useAsset";
import { useAssetStore } from "@/stores/assetStore";
import { ArrowRightIcon } from "lucide-vue-next";
import Button from "@/components/Button/Button.vue";

const props = defineProps<{
  assetId: string;
  title: string;
}>();

const assetStore = useAssetStore();
const assetIdRef = computed(() => props.assetId);
const parentAssetIdRef = computed((): string => assetStore.activeAssetId ?? "");
const { asset } = useAsset(assetIdRef, parentAssetIdRef);
</script>
<style scoped>
.collapsed-inline-related-asset-widget-item {
  gap: 0.75rem;
}
</style>
