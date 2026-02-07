<template>
  <section class="my-4">
    <header class="flex items-baseline gap-2">
      <h3 class="font-bold">Collections</h3>
      <Button
        v-if="selectedCollections.length"
        variant="tertiary"
        @click="searchStore.clearCollectionIdFilters()">
        clear
      </Button>
    </header>

    <p class="text-on-surface-variant text-xs mb-2 italic">
      To limit your search to specific collections, choose "Add Collection"
      below.
    </p>

    <ul
      v-if="selectedCollections.length"
      class="flex flex-wrap gap-2 bg-transparent-black-50 p-4 mb-4 rounded-md">
      <li
        v-for="collection in selectedCollections"
        :key="collection.id"
        class="text-xs bg-surface rounded-md border border-outline inline-flex items-center text-on-surface px-2 py-1\">
        {{ collection.title }}

        <button
          class="ml-2 h-full flex items-center justify-center"
          @click="searchStore.removeCollectionIdFilter(collection.id)">
          <XIcon class="!h-3 !w-3" />
        </button>
      </li>
    </ul>

    <AdvSearchDropDown
      v-if="unselectedCollections.length"
      label="Add Collection">
      <AdvSearchDropDownItem
        v-for="collection in unselectedCollections"
        :key="collection.id"
        class="!whitespace-nowrap overflow-ellipsis overflow-x-hidden"
        :title="prefixWithHyphens(collection.title)"
        :disabled="!collection.canView"
        @click="searchStore.addCollectionIdFilter(collection.id)">
        {{ prefixWithHyphens(collection.title) }}
      </AdvSearchDropDownItem>
    </AdvSearchDropDown>
  </section>
</template>
<script setup lang="ts">
import { computed } from "vue";
import Button from "@/components/Button/Button.vue";
import { useInstanceStore } from "@/stores/instanceStore";
import { XIcon } from "@/icons";
import { useSearchStore } from "@/stores/searchStore";
import AdvSearchDropDown from "./AdvSearchDropDown.vue";
import AdvSearchDropDownItem from "./AdvSearchDropDownItem.vue";

const instanceStore = useInstanceStore();
const searchStore = useSearchStore();

const selectedCollections = computed(() => {
  return instanceStore.flatCollections
    .filter((collection) =>
      searchStore.filterBy.collectionIds.includes(collection.id)
    )
    .sort((a, b) => a.title.localeCompare(b.title));
});

const unselectedCollections = computed(() => {
  return instanceStore.flatCollections
    .filter(
      (collection) =>
        !searchStore.filterBy.collectionIds.includes(collection.id)
    )
    .sort((a, b) => a.title.localeCompare(b.title));
});

function prefixWithHyphens(input: string): string {
  const parts = input.split(" › ");

  if (parts.length === 1) return input;

  const hyphenPrefix = "-".repeat(parts.length - 1);
  const lastPart = parts[parts.length - 1];

  return `${hyphenPrefix} ${lastPart}`;
}
</script>
<style scoped></style>
