<template>
  <div class="search-results-page__browser-collection-header">
    <header class="pb-8 my-8">
      <Link :to="`/search/listCollections`" class="flex items-center gap-1">
        <ArrowForwardIcon class="transform rotate-180 h-4 w-4" />
        Back to Collections
      </Link>
      <h2 v-if="collection?.title" class="text-4xl font-bold mt-4">
        Browsing {{ collection?.title }}
      </h2>

      <SanitizedHTML
        v-if="collection?.description"
        :html="collection.description"
        class="prose max-w-screen-lg mt-2" />
      <template v-if="!collection">
        <Skeleton class="!w-1/2 !h-12 !my-8" />
      </template>
    </header>
  </div>
</template>
<script setup lang="ts">
import { watch, ref } from "vue";
import { AssetCollection } from "@/types";
import { useInstanceStore } from "@/stores/instanceStore";
import Link from "@/components/Link/Link.vue";
import { ArrowForwardIcon } from "@/icons";
import SanitizedHTML from "@/components/SanitizedHTML/SanitizedHTML.vue";
import Skeleton from "@/components/Skeleton/Skeleton.vue";

const props = defineProps<{
  collectionId: number;
}>();

const instanceStore = useInstanceStore();
const collection = ref<AssetCollection | null>(null);

watch(
  [() => props.collectionId, () => instanceStore.isReady],
  async () => {
    if (!instanceStore.isReady) return;

    collection.value = await instanceStore.getCollectionById(
      props.collectionId
    );
  },
  { immediate: true }
);
</script>
<style scoped></style>
