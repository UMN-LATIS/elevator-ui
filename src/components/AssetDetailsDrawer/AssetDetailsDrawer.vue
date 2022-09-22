<template>
  <div class="asset-details">
    <Drawer :label="assetTitle" :isOpen="isOpen" @toggle="$emit('toggle')">
      <WidgetList v-if="assetId" :assetId="assetId" />
      <div v-if="!assetId">
        <h2 class="text-xl font-bold text-neutral-900 mb-4">
          😢 Sorry. Something's off.
        </h2>
        <p>No asset found.</p>
        <code class="text-sm">assetId: {{ assetId ?? "null" }}</code>
      </div>

      <!-- For development only? -->
      <footer v-if="assetId" class="flex gap-2">
        <Button :href="getAssetUrl(assetId)" icon="image" target="_blank">
          View
        </Button>
        <Button
          :href="`${getAssetUrl(assetId)}/true`"
          label="Asset Json"
          icon="data_object"
          target="_blank"
        >
          Data
        </Button>
      </footer>
    </Drawer>
  </div>
</template>
<script setup lang="ts">
import { ref, watch, computed } from "vue";
import Drawer from "@/components/Drawer/Drawer.vue";
import WidgetList from "@/components/WidgetList/WidgetList.vue";
import { useAssetStore } from "@/stores/assetStore";
import type { Asset } from "@/types";
import { getAssetTitle, getAssetUrl } from "@/helpers/displayUtils";
import Button from "@/components/Button/Button.vue";

const props = withDefaults(
  defineProps<{
    assetId: string | null;
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
    if (!props.assetId) {
      console.error("No assetId");
      return;
    }
    asset.value = await assetStore.fetchAsset(props.assetId);
  },
  { immediate: true }
);
</script>
<style scoped></style>
