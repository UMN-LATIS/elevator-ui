<template>
  <div class="asset-details">
    <Drawer
      :label="assetTitle"
      :isOpen="isOpen"
      :showToggle="showToggle"
      class="h-full"
      @toggle="$emit('toggle')"
    >
      <template #header-label>
        <DrawerLabel
          :label="assetTitle"
          :class="{
            'text-2xl': isOpen,
          }"
        />
      </template>
      <WidgetList v-if="assetId" :assetId="assetId" />
      <MoreLikeThis :items="moreLikeThisItems" />
    </Drawer>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Drawer from "@/components/Drawer/Drawer.vue";
import WidgetList from "@/components/WidgetList/WidgetList.vue";
import { getAssetTitle } from "@/helpers/displayUtils";
import { useAsset } from "@/helpers/useAsset";
import MoreLikeThis from "../MoreLikeThis/MoreLikeThis.vue";
import DrawerLabel from "../Drawer/DrawerLabel.vue";
import api from "@/helpers/api";
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
