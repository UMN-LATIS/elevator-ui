<template>
  <DefaultLayout class="all-collections-page">
    <template #custom-header>
      <CustomAppHeader v-if="instanceStore.customHeaderMode == 1" />
    </template>
    <div class="p-8 px-4">
      <h1 class="text-4xl font-bold my-8">Collections</h1>
      <SanitizedHTML
        v-if="collectionPageContent?.content"
        class="mb-8"
        :html="collectionPageContent.content"
      />
      <div ref="collectionGrid" class="grid">
        <CollectionItem
          v-for="collection in collections"
          :key="collection.id"
          :collection="collection"
        />
      </div>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import CollectionItem from "./CollectionItem.vue";
import CustomAppHeader from "@/components/CustomAppHeader/CustomAppHeader.vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useInstanceStore } from "@/stores/instanceStore";
import { useResizeObserver } from "@vueuse/core";
import { ApiStaticPageResponse } from "@/types";
import api from "@/api";
import SanitizedHTML from "@/components/SanitizedHTML/SanitizedHTML.vue";

const instanceStore = useInstanceStore();
const collectionGrid = ref<HTMLElement | null>(null);

const collections = computed(() => instanceStore.collections);
const numCols = ref(1);
const collectionPageContent = ref<ApiStaticPageResponse | null>(null);

onMounted(async () => {
  const collectionPage = instanceStore.pages.find(
    (page) => page.title === "Collection Page"
  );
  if (!collectionPage) return;

  collectionPageContent.value = await api.getStaticPage(collectionPage.id);
});

// by default, css grid will order the items by left-to-right,
// then top-to-bottom. This makes is difficult to read:
// we want to show grid columns ordered top-to-bottom,
// then left-to-right so that it reads alphabetically.
// once we know the number of rows and columns, we can
// use css grid and set grid-auto-flow to column
// to achieve this.
useResizeObserver(collectionGrid, (entries) => {
  const [entry] = entries;
  const { width } = entry.contentRect;
  if (width < 640) numCols.value = 1;
  if (width < 768) numCols.value = 2;
  if (width < 1024) numCols.value = 3;
  if (width >= 1024) numCols.value = 4;
});

const numRows = computed(() => {
  const numCollections = collections.value.length;
  return Math.ceil(numCollections / numCols.value);
});
</script>
<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(v-bind("numCols"), 1fr);
  grid-template-rows: repeat(v-bind("numRows"), auto);
  grid-auto-flow: column;
  gap: 0.5rem;
}
</style>
