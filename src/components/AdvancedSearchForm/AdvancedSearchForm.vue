<template>
  <form
    ref="advancedSearchForm"
    class="advanced-search-form bg-surface rounded-3xl shadow-md"
    @submit.prevent="handleSubmit">
    <div class="p-2">
      <h1 class="sr-only">Advanced Search</h1>

      <SearchTextInputGroup class="mb-4" @moreOptionClick="$emit('close')" />
      <div class="flex gap-4 items-center px-2 mb-4 flex-wrap">
        <Toggle
          v-model="searchStore.filterBy.useBooleanOperators"
          settingLabel="Use Boolean Operators"
          onLabel="Use Boolean Operators"
          onLabelClass="text-sm"></Toggle>
        <Toggle
          v-if="instanceStore.currentUser?.isAdmin"
          v-model="searchStore.filterBy.includeHiddenAssets"
          settingLabel="Include Hidden Assets"
          onLabel="Include Hidden"
          onLabelClass="text-sm"></Toggle>
      </div>
      <div class="px-2">
        <h2
          class="font-bold text-xs uppercase pb-2 border-b border-b-outline-variant">
          Filter By
        </h2>
        <div class="max-h-[60vh] overflow-y-auto px-2">
          <FilterByCollectionsSection />
          <FilterByFieldsSection />
        </div>
      </div>
    </div>
    <div
      class="flex bg-surface-container p-2 justify-end items-center gap-2 rounded-b-3xl">
      <Button
        variant="tertiary"
        type="button"
        @click="searchStore.clearAllFilters">
        Clear All
      </Button>
      <Button
        variant="primary"
        type="submit"
        class="!rounded-full text-sm !py-2 sm:!px-4"
        :disabled="!searchStore.isValidSearch">
        Search
      </Button>
    </div>
  </form>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, useTemplateRef } from "vue";
import Button from "@/components/Button/Button.vue";
import { useSearchStore } from "@/stores/searchStore";
import { onClickOutside } from "@vueuse/core";
import SearchTextInputGroup from "../SearchBar/SearchTextInputGroup.vue";
import FilterByCollectionsSection from "./FilterByCollectionsSection.vue";
import FilterByFieldsSection from "./FilterByFieldsSection.vue";
import Toggle from "@/components/Toggle/Toggle.vue";
import { useInstanceStore } from "@/stores/instanceStore";

const emit = defineEmits<{
  (eventName: "close"): void;
  (eventName: "submit"): void;
}>();

const searchStore = useSearchStore();
const instanceStore = useInstanceStore();
const advancedSearchForm = useTemplateRef("advancedSearchForm");

onClickOutside(advancedSearchForm, () => {
  emit("close");
});

function handleEscapeKey(event: KeyboardEvent) {
  if (event.key === "Escape") {
    emit("close");
  }
}

function handleSubmit(event: Event) {
  event.preventDefault();
  if (!searchStore.isValidSearch) return;
  emit("submit");
}

onMounted(() => {
  document.addEventListener("keydown", handleEscapeKey);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleEscapeKey);
});
</script>
<style scoped></style>
