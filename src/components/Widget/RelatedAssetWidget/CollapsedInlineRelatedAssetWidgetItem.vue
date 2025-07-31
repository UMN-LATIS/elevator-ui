<template>
  <section
    v-if="asset"
    class="collapsed-inline-related-asset-widget-item flex flex-col">
    <h3>{{ title }}</h3>
    <WidgetList :assetId="assetId" />
  </section>
</template>
<script setup lang="ts">
import WidgetList from "@/components/WidgetList/WidgetList.vue";
import { computed } from "vue";
import { useAsset } from "@/helpers/useAsset";

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
