<template>
  <DefaultLayout class="all-collections-page">
    <template #custom-header>
      <CustomAppHeader
        v-if="customHeaderMode === ShowCustomHeaderMode.ALWAYS" />
    </template>
    <div class="p-8 px-4">
      <div class="flex flex-wrap items-center justify-between gap-4 my-8">
        <h1 class="text-4xl font-bold">Collections</h1>
        <div v-if="currentUser?.isAdmin" class="flex items-center gap-2">
          <Button to="/admin/collections">Manage Collections</Button>
        </div>
      </div>
      <SanitizedHTML
        v-if="collectionPageContent?.content"
        class="mb-8"
        :html="collectionPageContent.content" />
      <div ref="collectionGrid" class="grid">
        <CollectionItem
          v-for="collection in browsableCollections"
          :key="collection.id"
          :collection="collection" />
      </div>
    </div>
    <template #footer>
      <AppFooter v-if="customHeaderMode === ShowCustomHeaderMode.ALWAYS" />
    </template>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import CollectionItem from "@/components/CollectionItem/CollectionItem.vue";
import CustomAppHeader from "@/components/CustomAppHeader/CustomAppHeader.vue";
import AppFooter from "@/components/AppFooter/AppFooter.vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useCollections } from "@/composables/useCollections";
import { useCurrentUser } from "@/composables/useCurrentUser";
import { useCustomHeaderFooter } from "@/composables/useCustomHeaderFooter";
import { useNavPages } from "@/composables/useNavPages";
import { useCustomPageViewQuery } from "@/queries/customPageQueries";
import { useResizeObserver } from "@vueuse/core";
import { ShowCustomHeaderMode } from "@/types";
import SanitizedHTML from "@/components/SanitizedHTML/SanitizedHTML.vue";
import Button from "@/components/Button/Button.vue";

const { browsableCollections } = useCollections();
const { currentUser } = useCurrentUser();
const { customHeaderMode } = useCustomHeaderFooter();
const { navPages } = useNavPages();
const collectionGrid = useTemplateRef("collectionGrid");

const numCols = ref(1);

const collectionPageId = computed(
  () =>
    navPages.value.find((page) => page.title === "Collection Page")?.id ?? null
);
const { data: collectionPageContent } = useCustomPageViewQuery(
  collectionPageId,
  { enabled: () => !!collectionPageId.value }
);

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
  if (width < 640) {
    numCols.value = 1;
    return;
  }
  if (width < 768) {
    numCols.value = 2;
    return;
  }
  if (width < 1024) {
    numCols.value = 3;
    return;
  }
  numCols.value = 4;
});

const numRows = computed(() => {
  const numCollections = browsableCollections.value.length;
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
