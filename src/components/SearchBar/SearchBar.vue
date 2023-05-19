<template>
  <div class="relative">
    <form class="search-bar" @submit.prevent="handleSubmit">
      <SearchTextInputGroup
        @moreOptionClick="isAdvancedSearchModalOpen = true"
      />
    </form>

    <div
      class="fixed inset-0 bg-transparent-black-700 z-30 px-4 py-2"
      :class="{
        hidden: !isAdvancedSearchModalOpen,
      }"
    >
      <AdvancedSearchForm
        :isOpen="isAdvancedSearchModalOpen"
        class="w-full max-w-3xl m-auto"
        @submit="handleSubmit"
        @close="isAdvancedSearchModalOpen = false"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import AdvancedSearchForm from "@/components/AdvancedSearchForm/AdvancedSearchForm.vue";
import { useSearchStore } from "@/stores/searchStore";
import { useRouter } from "vue-router";
import SearchTextInputGroup from "./SearchTextInputGroup.vue";

const inputGroup = ref<InstanceType<typeof InputGroup> | null>(null);
const isAdvancedSearchModalOpen = ref(false);
const searchStore = useSearchStore();
const router = useRouter();

async function handleSubmit() {
  // close advanced search modal if open
  isAdvancedSearchModalOpen.value = false;

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

document.addEventListener("keydown", focusInputOnCommandK);
document.addEventListener("keydown", removeFocusOnEscape);
</script>
<style scoped></style>
