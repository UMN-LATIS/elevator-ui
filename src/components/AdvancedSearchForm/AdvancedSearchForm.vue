<template>
  <div
    :class="{ hidden: !isOpen, block: isOpen }"
    class="bg-white rounded-2xl shadow-md w-full relative"
  >
    <div ref="advancedSearchForm" class="p-4">
      <header class="flex gap-2 items-center justify-between mb-6">
        <h1 class="sr-only">Advanced Search</h1>
        <InputGroup
          id="search"
          ref="inputGroup"
          :value="searchStore.query"
          label="Search"
          :labelHidden="true"
          placeholder="Search"
          class="flex-1"
          inputClass="!rounded-full"
          @input="searchStore.query = ($event.target as HTMLInputElement).value"
        >
          <template #append>
            <button
              v-if="searchStore.query.length"
              type="button"
              class="text-transparent-black-500 hover:text-neutral-900 mr-2"
              @click="searchStore.query = ''"
            >
              <CircleXIcon class="" />
            </button>
            <button
              v-if="searchStore.hasFiltersApplied"
              type="button"
              class="inline-flex items-center justify-center rounded-full bg-neutral-900 text-neutral-300 text-xs py-1 px-2"
              @click="$emit('close')"
            >
              {{ searchStore.filteredByCount }}
              {{ pluralize(searchStore.filteredByCount, "filter") }}
            </button>
          </template>
        </InputGroup>
        <XIcon @click="$emit('close')" />
      </header>

      <h2
        class="font-bold text-xs uppercase pb-2 border-b border-b-neutral-200 mb-4"
      >
        Filter By
      </h2>

      <section>
        <header class="flex items-baseline gap-2 mb-2">
          <h3 class="font-bold">Collections</h3>
          <Button
            v-if="selectedCollections.length"
            variant="tertiary"
            @click="searchStore.clearCollectionIdFilters()"
          >
            clear
          </Button>
        </header>
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
              labelClass="text-xs py-0"
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
      <Button variant="tertiary">Reset All</Button>
      <Button variant="primary">Search</Button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import Button from "@/components/Button/Button.vue";
import DropDown from "@/components/DropDown/DropDown.vue";
import DropDownItem from "@/components/DropDown/DropDownItem.vue";
import { useInstanceStore } from "@/stores/instanceStore";
import { XIcon, CircleXIcon } from "@/icons";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import { useSearchStore } from "@/stores/searchStore";
import Chip from "../Chip/Chip.vue";
import { pluralize } from "@/helpers/pluralize";
import { onClickOutside } from "@vueuse/core";

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (eventName: "close"): void;
}>();

const instanceStore = useInstanceStore();
const searchStore = useSearchStore();
const advancedSearchForm = ref<HTMLDivElement | null>(null);

const selectedCollections = computed(() => {
  return instanceStore.collections
    .filter((collection) =>
      searchStore.filterBy.collectionIds.includes(collection.id)
    )
    .sort((a, b) => a.title.localeCompare(b.title));
});

const unselectedCollections = computed(() => {
  return instanceStore.collections.filter(
    (collection) => !searchStore.filterBy.collectionIds.includes(collection.id)
  );
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
