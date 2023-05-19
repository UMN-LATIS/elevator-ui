<template>
  <InputGroup
    id="search"
    ref="inputGroup"
    label="Search"
    :labelHidden="true"
    placeholder="Search"
    :value="searchStore.query"
    inputClass="!rounded-full"
    @focus="searchInputHasFocus = true"
    @blur="searchInputHasFocus = false"
    @input="searchStore.query = ($event.target as HTMLInputElement).value"
  >
    <template #append>
      <div class="flex gap-1 items-center">
        <button
          v-if="searchStore.query.length"
          type="button"
          class="text-transparent-black-500 hover:text-neutral-900"
          @click="searchStore.query = ''"
        >
          <CircleXIcon />
        </button>
        <button
          v-if="!searchStore.hasFiltersApplied"
          type="button"
          class="w-8 h-8 inline-flex items-center justify-center rounded-full"
          @click="$emit('moreOptionClick')"
        >
          <span class="sr-only">Advanced Search</span>
          <VerticalDotsIcon class="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          v-if="searchStore.hasFiltersApplied"
          type="button"
          class="inline-flex items-center justify-center rounded-full bg-neutral-900 text-neutral-300 text-xs py-1 px-2"
          @click="$emit('moreOptionClick')"
        >
          {{ searchStore.filteredByCount }}
          {{ pluralize(searchStore.filteredByCount, "filter") }}
        </button>
        <button
          class="hidden md:inline-flex items-center justify-center bg-transparent-black-100 w-8 h-8 text-sm rounded-full text-neutral-900 gap-1 hover:bg-neutral-900 hover:text-neutral-200 transition:ease-in-out duration-150"
          type="submit"
        >
          <SearchIcon
            v-if="searchStore.isReady"
            class="h-4 w-4"
            aria-hidden="true"
          />
          <SpinnerIcon v-else class="h-4 w-4" aria-hidden="true" />
          <span class="sr-only">Search</span>
        </button>
      </div>
    </template>
  </InputGroup>
</template>
<script setup lang="ts">
import { onUnmounted, onMounted, ref } from "vue";
import { SearchIcon, CircleXIcon, SpinnerIcon } from "@/icons";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import { VerticalDotsIcon } from "@/icons";
import { useSearchStore } from "@/stores/searchStore";
import { pluralize } from "@/helpers/pluralize";

defineEmits<{
  (eventName: "moreOptionClick"): void;
}>();

const inputGroup = ref<InstanceType<typeof InputGroup> | null>(null);
const searchInputHasFocus = ref(false);
const searchStore = useSearchStore();

function focusInputOnCommandK(event: KeyboardEvent) {
  if (!inputGroup.value) return;
  if (event.metaKey && event.key === "k") {
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
