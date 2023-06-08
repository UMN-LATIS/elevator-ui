<template>
  <form
    ref="advancedSearchForm"
    class="bg-white rounded-3xl shadow-md"
    @submit.prevent="$emit('submit')"
  >
    <div class="p-2">
      <h1 class="sr-only">Advanced Search</h1>

      <SearchTextInputGroup class="mb-4" @moreOptionClick="$emit('close')" />
      <div class="px-2">
        <h2
          class="font-bold text-xs uppercase pb-2 border-b border-b-neutral-200 mb-4"
        >
          Filter By
        </h2>
        <div class="max-h-[60vh] overflow-y-auto px-2">
          <FilterByCollectionsSection />
          <FilterByFieldsSection />
        </div>
      </div>
    </div>
    <div
      class="flex bg-transparent-black-100 p-2 justify-end items-center gap-4"
    >
      <Button
        variant="tertiary"
        type="button"
        @click="searchStore.clearAllFilters"
        >Clear All</Button
      >
      <Button variant="primary" type="submit" class="!rounded-full">
        Search
      </Button>
    </div>
  </form>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import Button from "@/components/Button/Button.vue";
import { useSearchStore } from "@/stores/searchStore";
import { onClickOutside } from "@vueuse/core";
import SearchTextInputGroup from "../SearchBar/SearchTextInputGroup.vue";
import FilterByCollectionsSection from "./FilterByCollectionsSection.vue";
import FilterByFieldsSection from "./FilterByFieldsSection.vue";

const emit = defineEmits<{
  (eventName: "close"): void;
  (eventName: "submit"): void;
}>();

const searchStore = useSearchStore();
const advancedSearchForm = ref<HTMLDivElement | null>(null);

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
