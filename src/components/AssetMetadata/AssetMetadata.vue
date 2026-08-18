<template>
  <div class="asset-metadata flex flex-col gap-4">
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
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import WidgetList from "@/components/WidgetList/WidgetList.vue";
import Tuple from "@/components/Tuple/Tuple.vue";
import CollectionTuple from "./CollectionTuple.vue";
import MoreLikeThis from "@/components/MoreLikeThis/MoreLikeThis.vue";
import { useAsset } from "@/helpers/useAsset";
import api from "@/api";
import { SearchResultMatch } from "@/types";
import { TEMPLATE_SHOW_PROPERTY_POSITIONS } from "@/constants/constants";

const props = defineProps<{
  assetId: string | null;
  parentAssetId?: string | null;
}>();

const assetIdRef = computed(() => props.assetId);
const parentAssetIdRef = computed(() => props.parentAssetId ?? null);
const { asset, template } = useAsset(assetIdRef, parentAssetIdRef);

const moreLikeThisItems = ref<SearchResultMatch[]>([]);

const showCollectionTop = computed(
  () =>
    template.value?.showCollection &&
    template.value?.showCollectionPosition ===
      TEMPLATE_SHOW_PROPERTY_POSITIONS.TOP
);

const showCollectionBottom = computed(
  () =>
    template.value?.showCollection &&
    template.value?.showCollectionPosition ===
      TEMPLATE_SHOW_PROPERTY_POSITIONS.BOTTOM
);

const showTemplateTop = computed(
  () =>
    template.value?.showTemplate &&
    template.value?.showTemplatePosition ===
      TEMPLATE_SHOW_PROPERTY_POSITIONS.TOP
);

const showTemplateBottom = computed(
  () =>
    template.value?.showTemplate &&
    template.value?.showTemplatePosition ===
      TEMPLATE_SHOW_PROPERTY_POSITIONS.BOTTOM
);

watch(
  assetIdRef,
  async () => {
    moreLikeThisItems.value = await api.getMoreLikeThis(assetIdRef.value);
  },
  { immediate: true }
);
</script>
<style scoped></style>
