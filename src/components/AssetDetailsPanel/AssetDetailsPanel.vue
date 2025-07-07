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
          class="mr-2">
          <span class="sr-only">Edit Asset</span>
          <PencilIcon class="size-4 text-blue-700" />
        </IconButton>
      </template>
      <template v-if="assetId && asset && template">
        <CollectionTuple
          v-if="showCollectionTop"
          :collectionId="asset.collectionId"
          label="Collection" />

        <Tuple v-if="showTemplateTop" label="Template">
          {{ template.templateName }}
        </Tuple>
        <WidgetList :assetId="assetId" class="py-4 md:py-0" />
        <CollectionTuple
          v-if="showCollectionBottom"
          :collectionId="asset.collectionId"
          label="Collection" />

        <Tuple v-if="showTemplateBottom" label="Template">
          {{ template.templateName }}
        </Tuple>

        <MoreLikeThis :items="moreLikeThisItems" />
      </template>
    </Panel>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Panel from "@/components/Panel/Panel.vue";
import WidgetList from "@/components/WidgetList/WidgetList.vue";
import Tuple from "@/components/Tuple/Tuple.vue";
import CollectionTuple from "./CollectionTuple.vue";
import { getAssetTitle } from "@/helpers/displayUtils";
import { useAsset } from "@/helpers/useAsset";
import MoreLikeThis from "../MoreLikeThis/MoreLikeThis.vue";
import PanelLabel from "../Panel/PanelLabel.vue";
import api from "@/api";
import { SearchResultMatch } from "@/types";
import { TEMPLATE_SHOW_PROPERTY_POSITIONS } from "@/constants/constants";
import { RouterLink } from "vue-router";
import { useInstanceStore } from "@/stores/instanceStore";
import { PencilIcon } from "lucide-vue-next";
import IconButton from "../IconButton/IconButton.vue";

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
const { asset, template } = useAsset(assetIdRef);
const instanceStore = useInstanceStore();
const moreLikeThisItems = ref<SearchResultMatch[]>([]);
const showCollectionBottom = computed(
  () =>
    template.value?.showCollection &&
    template.value?.showCollectionPosition ===
      TEMPLATE_SHOW_PROPERTY_POSITIONS.BOTTOM
);

const showCollectionTop = computed(
  () =>
    template.value?.showCollection &&
    template.value?.showCollectionPosition ===
      TEMPLATE_SHOW_PROPERTY_POSITIONS.TOP
);

const showTemplateBottom = computed(
  () =>
    template.value?.showTemplate &&
    template.value?.showTemplatePosition ===
      TEMPLATE_SHOW_PROPERTY_POSITIONS.BOTTOM
);

const showTemplateTop = computed(
  () =>
    template.value?.showTemplate &&
    template.value?.showTemplatePosition ===
      TEMPLATE_SHOW_PROPERTY_POSITIONS.TOP
);

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
