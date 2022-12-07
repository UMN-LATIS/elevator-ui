<template>
  <DefaultLayout>
    <div class="search-results-page">
      <h1>Search Results</h1>
      <p>Search results for:</p>
      <div class="search-results">
        <p v-if="matches.length === 0">No results found.</p>
        <div v-for="match in matches" v-else :key="match.objectId">
          {{ match.title }}
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { ref, onMounted } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { SearchResultMatch } from "@/types";
import api from "@/api";

const props = defineProps<{
  searchId: string;
}>();

const matches = ref<SearchResultMatch[]>([]);
const searchText = ref<string>("");
const page = ref(0);

onMounted(async () => {
  const res = await api.getSearchResultsById(props.searchId);
  searchText.value = res.searchEntry.searchText ?? "";
});

async function loadMore() {
  page.value += 1;
  const res = await api.getSearchResultsById(props.searchId, page.value);

  const moreMatches = res.matches;
  matches.value = [...matches.value, ...moreMatches];
}
</script>
<style scoped></style>
