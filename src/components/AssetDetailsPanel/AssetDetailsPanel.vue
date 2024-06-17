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
      <template v-if="assetId && asset">
        <WidgetList :assetId="assetId" class="py-4 md:py-0" />
        <Tuple
          v-if="template?.showCollection && collectionPath?.length"
          label="Collection">
          <template
            v-for="(collection, index) in collectionPath"
            :key="collection.id">
            <Link
              :to="`/collections/${collection.id}`"
              :class="{ 'mr-1': index < collectionPath.length - 1 }">
              {{ collection.title }}
            </Link>
            <span v-if="index < collectionPath.length - 1" class="mr-1">/</span>
          </template>
        </Tuple>
        <Tuple v-if="template?.showTemplate" label="Template">
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
import Link from "@/components/Link/Link.vue";
import { getAssetTitle } from "@/helpers/displayUtils";
import { useAsset } from "@/helpers/useAsset";
import MoreLikeThis from "../MoreLikeThis/MoreLikeThis.vue";
import PanelLabel from "../Panel/PanelLabel.vue";
import api from "@/api";
import { SearchResultMatch } from "@/types";
import { useInstanceStore } from "@/stores/instanceStore";

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
const moreLikeThisItems = ref<SearchResultMatch[]>([]);
const instanceStore = useInstanceStore();

const collectionPath = computed(() => {
  const collectionId = asset.value?.collectionId;
  if (!collectionId) return null;

  const collection = instanceStore.collectionIndex[collectionId];

  if (!collection) {
    throw new Error(`Collection ${collectionId} not found in instanceStore`);
  }

  // construct a path to this collection
  const path = [collection];
  let child = collection;
  while (child.parentId) {
    child = instanceStore.collectionIndex[child.parentId];
    path.unshift(child);
  }

  return path;
});

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
