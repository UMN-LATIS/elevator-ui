<template>
  <InputGroup
    id="search"
    ref="inputGroup"
    v-model="searchStore.query"
    class="search-bar__search-text-input-group"
    label="Search"
    inputmode="search"
    :labelHidden="true"
    placeholder="Search"
    inputClass="!rounded-full"
    @focus="searchInputHasFocus = true"
    @blur="searchInputHasFocus = false">
    <template #append>
      <div class="flex gap-1 items-center">
        <button
          v-if="searchStore.query.length"
          type="button"
          class="text-on-surface"
          @click="searchStore.query = ''">
          <span class="sr-only">Clear Search</span>
          <CircleXIcon />
        </button>

        <div
          class="advanced-search-toggle-container inline-flex"
          :class="{
            'advanced-search-toggle-container--has-filters':
              searchStore.hasFiltersApplied,
          }">
          <button
            v-if="!searchStore.hasFiltersApplied"
            type="button"
            class="w-8 h-8 inline-flex items-center justify-center rounded-full text-on-surface hover:bg-primary-container hover:text-on-primary-container transition:ease-in-out duration-150"
            @click="$emit('moreOptionClick')">
            <span class="sr-only">Advanced Search</span>
            <VerticalDotsIcon class="h-4 w-4" aria-hidden="true" />
          </button>
          <template v-else>
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-l-full text-xs py-1 px-2 border border-outline bg-inverse-surface text-inverse-on-surface"
              @click="$emit('moreOptionClick')">
              {{ searchStore.filteredByCount }}
              {{ pluralize(searchStore.filteredByCount, "filter") }}
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-r-full text-xs py-1 px-2 border !border-l-0 border-outline bg-inverse-surface text-inverse-on-surface"
              @click="handleClearAllFiltersClick">
              <span class="sr-only">Clear All Filters</span>
              <XIcon class="!h-3 !w-3" aria-hidden="true" />
            </button>
          </template>
        </div>
        <button
          class="inline-flex items-center justify-center text-on-surface hover:bg-primary-container hover:text-on-primary-container w-8 h-8 text-sm rounded-full gap-1 transition:ease-in-out duration-150"
          type="submit">
          <SpinnerIcon
            v-if="searchStore.status === 'fetching'"
            class="h-4 w-4"
            aria-hidden="true" />
          <SearchIcon v-else class="h-4 w-4" aria-hidden="true" />
          <span class="sr-only">Search</span>
        </button>
      </div>
    </template>
  </InputGroup>
</template>
<script setup lang="ts">
import {
  onUnmounted,
  onMounted,
  ref,
  useTemplateRef,
  type ComponentPublicInstance,
} from "vue";
import { SearchIcon, CircleXIcon, SpinnerIcon } from "@/icons";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import { VerticalDotsIcon } from "@/icons";
import { useSearchStore } from "@/stores/searchStore";
import { pluralize } from "@/helpers/pluralize";
import XIcon from "@/icons/XIcon.vue";

const emit = defineEmits<{
  (eventName: "moreOptionClick"): void;
  (eventName: "clearAllFilters"): void;
}>();

const inputGroup = useTemplateRef<ComponentPublicInstance>("inputGroup");
const searchInputHasFocus = ref(false);
const searchStore = useSearchStore();

function focusInputOnCommandK(event: KeyboardEvent) {
  if (!inputGroup.value) return;
  if ((event.metaKey || event.ctrlKey) && event.key === "k") {
    event.preventDefault();
    inputGroup.value.$el.querySelector("input")?.focus();
  }
}

function removeFocusOnEscape(event: KeyboardEvent) {
  if (!inputGroup.value) return;
  if (event.key === "Escape") {
    inputGroup.value.$el.querySelector("input")?.blur();
  }
}

function handleClearAllFiltersClick() {
  searchStore.clearAllFilters();
  emit("clearAllFilters");
}

onMounted(() => {
  document.addEventListener("keydown", focusInputOnCommandK);
  document.addEventListener("keydown", removeFocusOnEscape);
});

onUnmounted(() => {
  document.removeEventListener("keydown", focusInputOnCommandK);
  document.removeEventListener("keydown", removeFocusOnEscape);
});
</script>
<style scoped></style>
