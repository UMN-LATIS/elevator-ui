<template>
  <div>
    <form class="search-bar" @submit="handleSubmit">
      <InputGroup
        id="search"
        ref="inputGroup"
        label="Search"
        :labelHidden="true"
        placeholder="Search"
        :value="searchStore.query"
        inputClass="!rounded-full !border !border-neutral-300"
        @focus="handleInputGroupFocus"
        @blur="handleInputGroupBlur"
        @input="handleInput"
      >
        <template #append>
          <div class="flex gap-2 items-center">
            <button
              v-if="searchStore.query.length"
              type="button"
              class="text-transparent-black-500 hover:text-neutral-900"
              @click="handleClearSearchInput"
            >
              <CircleXIcon class="" />
            </button>

            <KeyboardShortcut
              class="hidden sm:block text-transparent-black-400 border-transparent-black-400"
            >
              ⌘K
            </KeyboardShortcut>

            <button
              class="inline-flex items-center justify-center w-8 h-8 bg-neutral-900 rounded-full text-neutral-200"
            >
              <span class="sr-only">Search</span>
              <SearchIcon class="h-4 w-4" aria-hidden="true" />
            </button>
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
import { useSearchStore } from "@/stores/searchStore";
import { useRouter } from "vue-router";

const emit = defineEmits<{
  (eventName: "focus", event: Event): void;
  (eventName: "blur", event: Event): void;
}>();

const inputGroup = ref<InstanceType<typeof InputGroup> | null>(null);
const searchInputHasFocus = ref(false);
const isAdvancedSearchModalOpen = ref(false);
const searchStore = useSearchStore();
const router = useRouter();

function handleInput(event: InputEvent) {
  searchStore.query = (event.target as HTMLInputElement).value;
}

function handleInputGroupFocus(event) {
  searchInputHasFocus.value = true;
  emit("focus", event);
}

function handleInputGroupBlur(event) {
  searchInputHasFocus.value = false;
  emit("blur", event);
}

async function handleSubmit(event: Event) {
  event.preventDefault();
  const searchId = await searchStore.search();
  if (!searchId) {
    router.push({
      name: "error",
      params: { errorCode: 400 },
    });
    return;
  }

  router.push({
    name: "search",
    params: { searchId },
  });
}

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

function handleClearSearchInput() {
  searchStore.query = "";
}

document.addEventListener("keydown", focusInputOnCommandK);
document.addEventListener("keydown", removeFocusOnEscape);
</script>
<style scoped></style>
