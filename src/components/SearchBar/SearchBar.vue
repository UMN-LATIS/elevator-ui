<template>
  <div>
    <form class="search-bar" @submit="handleSubmit">
      <InputGroup
        id="search"
        ref="inputGroup"
        label="Search"
        :labelHidden="true"
        placeholder="Search"
        :value="searchInput"
        @focus="searchInputHasFocus = true"
        @blur="searchInputHasFocus = false"
        @input="handleInput"
      >
        <template #prepend>
          <SearchIcon
            class="h-5 w-5 text-neutral-400"
            :class="{
              'text-neutral-600': searchInputHasFocus,
            }"
            aria-hidden="true"
          />
        </template>
        <template #append>
          <div class="flex gap-2 items-center">
            <button
              v-if="searchInput.length"
              type="button"
              class="text-neutral-400 hover:text-neutral-900"
              @click="clearSearch"
            >
              <CircleXIcon />
            </button>
            <!-- <button
              type="button"
              class="text-neutral-400 hover:text-neutral-900"
              @click="isAdvancedSearchModalOpen = true"
            >
              <OptionsIcon />
            </button> -->
            <KeyboardShortcut> ⌘K </KeyboardShortcut>
          </div>
        </template>
      </InputGroup>
    </form>
    <Modal
      label="Advanced Search"
      :isOpen="isAdvancedSearchModalOpen"
      @close="isAdvancedSearchModalOpen = false"
    >
      <AdvancedSearchForm />
    </Modal>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { OptionsIcon, SearchIcon, CircleXIcon } from "@/icons";
import KeyboardShortcut from "@/components/KeyboardShortcut/KeyboardShortcut.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import Modal from "@/components/Modal/Modal.vue";
import AdvancedSearchForm from "@/components/AdvancedSearchForm/AdvancedSearchForm.vue";

const inputGroup = ref<InstanceType<typeof InputGroup> | null>(null);

const searchInputHasFocus = ref(false);
const searchInput = ref("");
const isAdvancedSearchModalOpen = ref(false);

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

document.addEventListener("keydown", focusInputOnCommandK);
document.addEventListener("keydown", removeFocusOnEscape);

function handleSubmit(event: Event) {
  event.preventDefault();
  console.log("submit");
}

function handleInput(event: InputEvent) {
  searchInput.value = (event.target as HTMLInputElement).value;
}

function clearSearch() {
  if (!inputGroup.value) return;
  searchInput.value = "";
}

function handleOptionsClick() {
  console.log("options");
}
</script>
<style scoped></style>
