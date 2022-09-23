<template>
  <Transition name="fade">
    <div v-if="assetRef && templateRef" class="widget-list flex flex-col gap-8">
      <Widget
        v-for="widget in widgets"
        :key="widget.widgetId"
        :widget="widget"
        :asset="assetRef"
      />
    </div>
  </Transition>
</template>
<script setup lang="ts">
/**
 * lists all the asset's widget as defined by the asset
 * template
 */
import { ref, watch, computed } from "vue";
import { useAssetStore } from "@/stores/assetStore";
import type { Template, Asset } from "@/types";
import { getWidgetsForDisplay } from "@/helpers/displayUtils";
import Widget from "@/components/Widget/Widget.vue";

const props = defineProps<{
  assetId: string;
}>();

const assetStore = useAssetStore();
const assetRef = ref<Asset | null>(null);
const templateRef = ref<Template | null>(null);

// TODO: Do we need this here? Could this just be at the Page View?
watch(
  () => props.assetId,
  async () => {
    const { asset, template } = await assetStore.getAssetWithTemplate(
      props.assetId
    );

    assetRef.value = asset;
    templateRef.value = template;
  },
  { immediate: true }
);

const widgets = computed(() =>
  getWidgetsForDisplay({ asset: assetRef.value, template: templateRef.value })
);
</script>
<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
