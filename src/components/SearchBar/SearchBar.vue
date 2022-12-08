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
        @focus="handleInputGroupFocus"
        @blur="handleInputGroupBlur"
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

            <KeyboardShortcut class="hidden sm:block"> ⌘K </KeyboardShortcut>
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
import { SearchIcon, CircleXIcon } from "@/icons";
import KeyboardShortcut from "@/components/KeyboardShortcut/KeyboardShortcut.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import Modal from "@/components/Modal/Modal.vue";
import AdvancedSearchForm from "@/components/AdvancedSearchForm/AdvancedSearchForm.vue";
import api from "@/helpers/api";
import config from "@/config";

const emit = defineEmits<{
  (eventName: "focus", event: Event): void;
  (eventName: "blur", event: Event): void;
}>();

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

async function handleSubmit(event: Event) {
  event.preventDefault();
  const { searchId } = await api.search(searchInput.value);
  // redirect to search results page
  window.location.href = `${config.instance.base.url}/search/s/${searchId}`;
}

function handleInput(event: InputEvent) {
  searchInput.value = (event.target as HTMLInputElement).value;
}

function clearSearch() {
  if (!inputGroup.value) return;
  searchInput.value = "";
}

function handleInputGroupFocus(event) {
  searchInputHasFocus.value = true;
  emit("focus", event);
}

function handleInputGroupBlur(event) {
  searchInputHasFocus.value = false;
  emit("blur", event);
}
</script>
<style scoped></style>