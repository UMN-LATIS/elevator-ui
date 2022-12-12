<template>
  <DefaultLayout>
    <div class="search-results-page p-8">
      <h2 class="text-lg mb-8">
        Search results for:
        <span class="font-bold text-2xl">{{ searchText }}</span>
      </h2>
      <div v-if="loadStatus === 'loading'">
        <SpinnerIcon />
      </div>
      <p v-if="loadStatus === 'error'">Error loading search results.</p>
      <div v-if="loadStatus === 'loaded'" class="grid grid-cols-auto-md gap-4">
        <p v-if="matches.length === 0">No results found.</p>
        <SearchResultCard
          v-for="match in matches"
          :key="match.objectId"
          :searchMatch="match"
          :showDetails="false"
        />
      </div>
      <div class="mt-8">
        <Button
          variant="primary"
          class="btn btn-primary"
          :disabled="loadStatus === 'loading'"
          @click="loadMore"
        >
          Load more
        </Button>
      </div>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { SearchResultMatch } from "@/types";
import api from "@/api";
import SearchResultCard from "@/components/SearchResultCard/SearchResultCard.vue";
import { SpinnerIcon } from "@/icons";
import Button from "@/components/Button/Button.vue";

const props = defineProps<{
  searchId: string;
}>();

const matches = ref<SearchResultMatch[]>([]);
const searchText = ref<string>("");
const page = ref(0);
const loadStatus = ref<"loading" | "loaded" | "error">("loading");

watch(
  () => props.searchId,
  async () => {
    loadStatus.value = "loading";
    try {
      const res = await api.getSearchResultsById(props.searchId);
      searchText.value = res.searchEntry.searchText ?? "";
      matches.value = res.matches;
      loadStatus.value = "loaded";
    } catch (err) {
      loadStatus.value = "error";
      console.error(err);
    }
  },
  { immediate: true }
);

async function loadMore() {
  loadStatus.value = "loading";
  page.value += 1;
  const res = await api.getSearchResultsById(props.searchId, page.value);
  loadStatus.value = "loaded";

  const moreMatches = res.matches;
  matches.value = [...matches.value, ...moreMatches];
}
</script>
<style scoped></style>
