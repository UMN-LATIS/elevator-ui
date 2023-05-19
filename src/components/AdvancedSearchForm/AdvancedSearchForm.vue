<template>
  <form
    ref="advancedSearchForm"
    :class="{ hidden: !isOpen, block: isOpen }"
    class="bg-white rounded-2xl shadow-md w-full relative"
    @submit.prevent="$emit('submit')"
  >
    <div class="p-4">
      <h1 class="sr-only">Advanced Search</h1>

      <SearchTextInputGroup class="mb-4" @moreOptionClick="$emit('close')" />

      <h2
        class="font-bold text-xs uppercase pb-2 border-b border-b-neutral-200 mb-4"
      >
        Filter By
      </h2>

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
        <p class="text-neutral-400 text-xs italic mb-4">
          Choose which collections to search. If none are chosen, all will be
          searched.
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
              <div class="max-h-[25vh] overflow-y-auto">
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
    </div>
    <div
      class="flex bg-transparent-black-100 px-4 py-2 justify-end items-center gap-4"
    >
      <Button
        variant="tertiary"
        type="button"
        @click="searchStore.clearAllFilters"
        >Clear All</Button
      >
      <Button variant="primary" type="submit"> Search </Button>
    </div>
  </form>
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import Button from "@/components/Button/Button.vue";
import DropDown from "@/components/DropDown/DropDown.vue";
import DropDownItem from "@/components/DropDown/DropDownItem.vue";
import { useInstanceStore } from "@/stores/instanceStore";
import { XIcon } from "@/icons";
import { useSearchStore } from "@/stores/searchStore";
import { onClickOutside } from "@vueuse/core";
import SearchTextInputGroup from "../SearchBar/SearchTextInputGroup.vue";
import type { AssetCollection } from "@/types";

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (eventName: "close"): void;
  (eventName: "submit"): void;
}>();

const instanceStore = useInstanceStore();
const searchStore = useSearchStore();
const advancedSearchForm = ref<HTMLDivElement | null>(null);

function flattenCollections(collections: AssetCollection[]): AssetCollection[] {
  return [
    ...collections,
    ...collections.flatMap((collection) => {
      const children = collection.children ?? [];
      // prepend the parent title to the child title
      const childrenWithParentTitle = children.map((child) => ({
        ...child,
        title: `${collection.title} | ${child.title}`,
      }));
      return flattenCollections(childrenWithParentTitle);
    }),
  ];
}

const flatCollections = computed(() => {
  return flattenCollections(instanceStore.collections);
});

const selectedCollections = computed(() => {
  return flatCollections.value
    .filter((collection) =>
      searchStore.filterBy.collectionIds.includes(collection.id)
    )
    .sort((a, b) => a.title.localeCompare(b.title));
});

const unselectedCollections = computed(() => {
  return flatCollections.value
    .filter(
      (collection) =>
        !searchStore.filterBy.collectionIds.includes(collection.id)
    )
    .sort((a, b) => a.title.localeCompare(b.title));
});

onClickOutside(advancedSearchForm, () => {
  emit("close");
});

function handleEscapeKey(event: KeyboardEvent) {
  if (event.key === "Escape") {
    emit("close");
  }
}

onMounted(() => {
  document.addEventListener("keydown", handleEscapeKey);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleEscapeKey);
});
</script>
<style scoped></style>
