<template>
  <div class="asset-details">
    <Drawer :label="assetTitle" :isOpen="isOpen" @toggle="$emit('toggle')">
      <WidgetList :assetId="assetId" />
    </Drawer>
  </div>
</template>
<script setup lang="ts">
import { ref, watch, computed } from "vue";
import Drawer from "@/components/Drawer/Drawer.vue";
import WidgetList from "@/components/WidgetList/WidgetList.vue";
import { useAssetStore } from "@/stores/assetStore";
import type { Asset } from "@/types";
import { getAssetTitle } from "@/helpers/displayUtils";

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
const assetTitle = computed(() =>
  asset.value ? getAssetTitle(asset.value) : ""
);

watch(
  () => props.assetId,
  async () => {
    asset.value = await assetStore.fetchAsset(props.assetId);
  },
  { immediate: true }
);
</script>
<style scoped></style>
