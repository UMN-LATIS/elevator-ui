<template>
  <div class="relative">
    <form class="search-bar" @submit.prevent="handleSubmit">
      <SearchTextInputGroup
        @moreOptionClick="isAdvancedSearchModalOpen = true"
      />
    </form>
    <TransitionFade>
      <AdvancedSearchForm
        v-if="isAdvancedSearchModalOpen"
        :isOpen="isAdvancedSearchModalOpen"
        class="fixed top-1 right-1 left-1 m-auto z-40 sm:absolute sm:!-top-2 sm:!-right-2 sm:!-left-2 advanced-search-form"
        @submit="handleSubmit"
        @close="isAdvancedSearchModalOpen = false"
      />
    </TransitionFade>

    <!-- overlay -->
    <TransitionFade>
      <div
        v-if="isAdvancedSearchModalOpen"
        class="fixed inset-0 bg-transparent-black-700 z-30"
      />
    </TransitionFade>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import AdvancedSearchForm from "@/components/AdvancedSearchForm/AdvancedSearchForm.vue";
import { useSearchStore } from "@/stores/searchStore";
import { useRouter } from "vue-router";
import SearchTextInputGroup from "./SearchTextInputGroup.vue";
import TransitionFade from "@/components/TransitionFade/TransitionFade.vue";

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
<style scoped>
@media (min-width: 640px) {
  .advanced-search-form {
    width: calc(100% + 1rem);
  }
}
</style>
