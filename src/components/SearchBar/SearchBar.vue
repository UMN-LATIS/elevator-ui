<template>
  <div class="relative">
    <form class="search-bar" @submit="handleSubmit">
      <InputGroup
        id="search"
        ref="inputGroup"
        label="Search"
        :labelHidden="true"
        placeholder="Search"
        :value="searchStore.query"
        inputClass="!rounded-full"
        @focus="handleInputGroupFocus"
        @blur="handleInputGroupBlur"
        @input="handleInput"
      >
        <template #append>
          <div class="flex gap-1 items-center">
            <button
              v-if="searchStore.query.length"
              type="button"
              class="text-transparent-black-500 hover:text-neutral-900"
              @click="handleClearSearchInput"
            >
              <CircleXIcon class="" />
            </button>
            <button
              type="button"
              class="w-8 h-8 inline-flex items-center justify-center rounded-full"
              :class="{
                'bg-neutral-900 text-white': isAdvancedSearchModalOpen,
              }"
              @click="isAdvancedSearchModalOpen = !isAdvancedSearchModalOpen"
            >
              <span class="sr-only">Advanced Search</span>
              <VerticalDotsIcon class="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              class="hidden md:inline-flex items-center justify-center bg-transparent-black-100 w-8 h-8 text-sm rounded-full text-neutral-900 gap-1 hover:bg-neutral-900 hover:text-neutral-200 transition:ease-in-out duration-150"
              type="submit"
            >
              <SearchIcon class="h-4 w-4" aria-hidden="true" />
              <span class="sr-only">Search</span>
            </button>
          </div>
        </template>
      </InputGroup>
    </form>
    <Teleport to="body" :disabled="!isMobileScreen">
      <div
        class="fixed inset-0 bg-transparent-black-700 z-30 p-4"
        :class="{
          hidden: !isAdvancedSearchModalOpen,
        }"
      >
        <AdvancedSearchForm
          :isOpen="isAdvancedSearchModalOpen"
          class="w-full max-w-3xl m-auto"
          :class="{
            '!absolute bottom-0 left-1/2 -translate-x-1/2 !rounded-bl-none !rounded-br-none':
              isMobileScreen,
          }"
          @close="isAdvancedSearchModalOpen = false"
        />
      </div>
    </Teleport>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { SearchIcon, CircleXIcon } from "@/icons";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import AdvancedSearchForm from "@/components/AdvancedSearchForm/AdvancedSearchForm.vue";
import { VerticalDotsIcon } from "@/icons";
import { useSearchStore } from "@/stores/searchStore";
import { useRouter } from "vue-router";
import { useMediaQuery } from "@vueuse/core";

const emit = defineEmits<{
  (eventName: "focus", event: Event): void;
  (eventName: "blur", event: Event): void;
}>();

const inputGroup = ref<InstanceType<typeof InputGroup> | null>(null);
const searchInputHasFocus = ref(false);
const isAdvancedSearchModalOpen = ref(false);
const searchStore = useSearchStore();
const router = useRouter();

const isMobileScreen = useMediaQuery("(max-width: 640px)");

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
