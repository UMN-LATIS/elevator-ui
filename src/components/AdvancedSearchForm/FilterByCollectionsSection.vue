<template>
  <section class="my-4">
    <header class="flex items-baseline gap-2">
      <h3 class="font-bold">Collections</h3>
      <Button
        v-if="selectedCollections.length"
        variant="tertiary"
        @click="searchStore.clearCollectionIdFilters()"
      >
        clear
      </Button>
    </header>

    <p class="text-neutral-400 text-xs mb-2 italic">
      To limit your search to specific collections, choose "Add Collection"
      below.
    </p>

    <ul class="inline-flex flex-wrap gap-1">
      <li
        v-for="collection in selectedCollections"
        :key="collection.id"
        class="text-xs bg-neutral-100 py-1 px-2 rounded-md border border-neutral-200 inline-flex items-center"
      >
        {{ collection.title }}

        <button
          class="ml-2"
          @click="searchStore.removeCollectionIdFilter(collection.id)"
        >
          <XIcon class="h-3 w-3" />
        </button>
      </li>
      <li v-if="unselectedCollections.length">
        <DropDown
          v-if="unselectedCollections.length"
          label="Add Collection"
          class="inline-flex border border-neutral-900 rounded-md text-xs"
          alignment="left"
          labelClass="text-xs py-0 !pr-0"
        >
          <div class="max-h-[50vh] overflow-y-auto">
            <DropDownItem
              v-for="collection in unselectedCollections"
              :key="collection.id"
              @click="searchStore.addCollectionIdFilter(collection.id)"
            >
              {{ collection.title }}
            </DropDownItem>
          </div>
        </DropDown>
      </li>
    </ul>
  </section>
</template>
<script setup lang="ts">
import { computed } from "vue";
import Button from "@/components/Button/Button.vue";
import DropDown from "@/components/DropDown/DropDown.vue";
import DropDownItem from "@/components/DropDown/DropDownItem.vue";
import { useInstanceStore } from "@/stores/instanceStore";
import { XIcon } from "@/icons";
import { useSearchStore } from "@/stores/searchStore";

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
</script>
<style scoped></style>
