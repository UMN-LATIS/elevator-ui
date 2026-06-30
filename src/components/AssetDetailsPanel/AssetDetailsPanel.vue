<template>
  <div class="asset-details-panel">
    <Panel
      :label="assetTitle"
      :isOpen="isOpen"
      :showToggle="showToggle"
      class="h-full py-4 md:py-0"
      @toggle="$emit('toggle')">
      <template #header-label>
        <PanelLabel
          :label="assetTitle || '(No Title)'"
          :class="{
            'text-2xl': isOpen,
          }" />
      </template>
      <template #header-utils>
        <IconButton
          v-if="assetId && instanceStore.currentUser?.canManageAssets"
          :to="`/assetManager/editAsset/${assetId}`"
          title="Edit Asset"
          class="flex items-center justify-center px-3 py-2 rounded-md">
          <span class="sr-only">Edit Asset</span>
          <PencilIcon class="size-4" />
        </IconButton>
      </template>
      <AssetMetadata :assetId="assetId" :parentAssetId="parentAssetId" />
    </Panel>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import Panel from "@/components/Panel/Panel.vue";
import AssetMetadata from "@/components/AssetMetadata/AssetMetadata.vue";
import { getAssetTitle } from "@/helpers/displayUtils";
import { useAsset } from "@/helpers/useAsset";
import PanelLabel from "../Panel/PanelLabel.vue";
import { useInstanceStore } from "@/stores/instanceStore";
import { PencilIcon } from "lucide-vue-next";
import IconButton from "../IconButton/IconButton.vue";

const props = withDefaults(
  defineProps<{
    assetId: string | null;
    isOpen?: boolean;
    showToggle?: boolean;
    parentAssetId?: string | null;
  }>(),
  {
    isOpen: true,
    showToggle: true,
    parentAssetId: null,
  }
);

defineEmits<{
  (eventName: "toggle");
}>();

const assetIdRef = computed(() => props.assetId);
const parentAssetIdRef = computed(() => props.parentAssetId);
const { asset } = useAsset(assetIdRef, parentAssetIdRef);
const instanceStore = useInstanceStore();

const assetTitle = computed(() =>
  asset.value ? getAssetTitle(asset.value) : ""
);
</script>
<style scoped></style>
