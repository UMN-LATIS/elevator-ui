<template>
  <section
    v-if="asset"
    class="collapsed-inline-related-asset-widget-item flex flex-col w-full">
    <div class="flex justify-between items-baseline">
      <h3>{{ title }}</h3>
      <Button :to="`/asset/viewAsset/${assetId}`" variant="tertiary">
        View
        <ArrowRightIcon class="size-4" />
        <span class="sr-only">Read more about {{ title }}</span>
      </Button>
    </div>
    <WidgetList :assetId="assetId" />
  </section>
</template>
<script setup lang="ts">
import WidgetList from "@/components/WidgetList/WidgetList.vue";
import { computed } from "vue";
import { useAsset } from "@/helpers/useAsset";
import { ArrowRightIcon } from "lucide-vue-next";
import Button from "@/components/Button/Button.vue";

const props = defineProps<{
  assetId: string;
  title: string;
}>();

const assetIdRef = computed(() => props.assetId);
const { asset } = useAsset(assetIdRef);
</script>
<style scoped>
.collapsed-inline-related-asset-widget-item {
  gap: var(--app-panel-body-items-gap);
}
</style>
