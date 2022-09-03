<template>
  <div v-if="asset" class="asset-details">
    <Drawer :label="assetTitle" :isOpen="isOpen" @toggle="$emit('toggle')">
      <WidgetList :assetId="assetId" />
    </Drawer>
  </div>
</template>
<script setup lang="ts">
import { ref, watchEffect, computed } from "vue";
import { useAssetStore } from "@/stores/newAssetStore";
import type { Asset, Template } from "@/types";
import Drawer from "./Drawer.vue";
import { getAssetTitle } from "@/Helpers/displayUtils";
import WidgetList from "./WidgetList.vue";

const props = withDefaults(
  defineProps<{
    assetId: string;
    isOpen?: boolean;
  }>(),
  {
    isOpen: true,
  }
);

defineEmits<{
  (eventName: "toggle");
}>();

const assetStore = useAssetStore();
const asset = ref<Asset | null>(null);
const template = ref<Template | null>(null);

watchEffect(async () => {
  asset.value = props.assetId
    ? await assetStore.fetchAsset(props.assetId)
    : null;

  template.value = asset.value
    ? await assetStore.fetchTemplateForAsset(props.assetId)
    : null;
});

const assetTitle = computed(() =>
  getAssetTitle({ asset: asset.value, template: template.value })
);
</script>
<style scoped></style>
