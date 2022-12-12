<template>
  <DefaultLayout>
    <div class="search-results-page p-8">
      <h2 class="text-lg mb-8">
        Search results for:
        <span class="font-bold text-2xl">{{ searchText }}</span>
      </h2>
      <p v-if="matches.length === 0">No results found.</p>
      <div v-else class="search-results">
        <SearchResultCard
          v-for="match in matches"
          :key="match.objectId"
          :searchMatch="match"
          :showDetails="false"
        />
      </div>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { ref, onMounted } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { SearchResultMatch } from "@/types";
import api from "@/api";
import SearchResultCard from "@/components/SearchResultCard/SearchResultCard.vue";

const props = defineProps<{
  searchId: string;
}>();

const matches = ref<SearchResultMatch[]>([]);
const searchText = ref<string>("");
const page = ref(0);

onMounted(async () => {
  const res = await api.getSearchResultsById(props.searchId);
  searchText.value = res.searchEntry.searchText ?? "";
  matches.value = res.matches;
});

async function loadMore() {
  page.value += 1;
  const res = await api.getSearchResultsById(props.searchId, page.value);

  const moreMatches = res.matches;
  matches.value = [...matches.value, ...moreMatches];
}
</script>
<style scoped>
.search-results {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  grid-gap: 1rem;
}
</style>
