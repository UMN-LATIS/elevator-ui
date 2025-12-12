<template>
  <div class="search-bar relative">
    <form class="search-bar__form" @submit.prevent="handleSubmit">
      <!-- main search bar -->
      <SearchTextInputGroup
        @moreOptionClick="isAdvancedSearchModalOpen = true"
        @clearAllFilters="
          () => {
            // resubmit the form if the user clicks clears all filters
            // and the advanced search modal is not open
            if (isAdvancedSearchModalOpen) return;
            handleSubmit();
          }
        " />
    </form>

    <!-- Always teleport to body for proper z-index -->
    <Teleport to="body">
      <!-- overlay -->
      <TransitionFade>
        <div
          v-if="isAdvancedSearchModalOpen"
          class="fixed inset-0 bg-black/75 z-30" />
      </TransitionFade>

      <!-- advanced search panel -->
      <TransitionFade>
        <AdvancedSearchForm
          v-if="isAdvancedSearchModalOpen"
          :isOpen="isAdvancedSearchModalOpen"
          class="advanced-search-form fixed left-4 right-4 top-1/2 -translate-y-1/2 z-40 mx-auto max-w-screen-sm sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:top-4 sm:translate-y-0 sm:w-full sm:max-w-2xl"
          @submit="handleSubmit"
          @close="isAdvancedSearchModalOpen = false" />
      </TransitionFade>
    </Teleport>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";
import AdvancedSearchForm from "@/components/AdvancedSearchForm/AdvancedSearchForm.vue";
import { useSearchStore } from "@/stores/searchStore";
import { useRouter, useRoute } from "vue-router";
import SearchTextInputGroup from "./SearchTextInputGroup.vue";
import TransitionFade from "@/components/TransitionFade/TransitionFade.vue";

const isAdvancedSearchModalOpen = ref(false);
const searchStore = useSearchStore();
const router = useRouter();

async function handleSubmit() {
  // close advanced search modal if open
  isAdvancedSearchModalOpen.value = false;

  const searchId = await searchStore.getSearchId();
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

const route = useRoute();

watch(
  route,
  (to, from) => {
    const isNewRoute = to.name !== from?.name;
    const isNotSearchOrAssetPage = !["search", "asset"].includes(
      to.name as string
    );

    if (isNewRoute && isNotSearchOrAssetPage) {
      searchStore.query = "";
      searchStore.clearAllFilters();
    }
  },
  { immediate: true }
);
</script>
<style scoped></style>
