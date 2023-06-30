<template>
  <div class="asset-details">
    <Panel
      :label="assetTitle"
      :isOpen="isOpen"
      :showToggle="showToggle"
      class="h-full py-4 md:py-0"
      @toggle="$emit('toggle')"
    >
      <template #header-label>
        <PanelLabel
          :label="assetTitle || '(No Title)'"
          :class="{
            'text-2xl': isOpen,
          }"
        />
      </template>
      <WidgetList v-if="assetId" :assetId="assetId" class="py-4 md:py-0" />
      <MoreLikeThis v-if="assetId" :items="moreLikeThisItems" />
    </Panel>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Panel from "@/components/Panel/Panel.vue";
import WidgetList from "@/components/WidgetList/WidgetList.vue";
import { getAssetTitle } from "@/helpers/displayUtils";
import { useAsset } from "@/helpers/useAsset";
import MoreLikeThis from "../MoreLikeThis/MoreLikeThis.vue";
import PanelLabel from "../Panel/PanelLabel.vue";
import api from "@/api";
import { SearchResultMatch } from "@/types";

const props = withDefaults(
  defineProps<{
    assetId: string | null;
    isOpen?: boolean;
    showToggle?: boolean;
  }>(),
  {
    isOpen: true,
    showToggle: true,
  }
);

defineEmits<{
  (eventName: "toggle");
}>();

const assetIdRef = computed(() => props.assetId);
const { asset } = useAsset(assetIdRef);
const moreLikeThisItems = ref<SearchResultMatch[]>([]);

watch(
  assetIdRef,
  async () => {
    moreLikeThisItems.value = await api.getMoreLikeThis(assetIdRef.value);
  },
  { immediate: true }
);

const assetTitle = computed(() =>
  asset.value ? getAssetTitle(asset.value) : ""
);
</script>
<style scoped></style>
