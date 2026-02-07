<template>
  <div
    v-if="hasSuggestions"
    class="search-results-page__did-you-mean-suggestions">
    <p>Did you mean?</p>
    <button
      class="text-m3-primary hover:underline italic"
      @click="handleSearchSuggestionClick">
      {{ suggestedSearch }}
    </button>
  </div>
</template>
<script setup lang="ts">
import { computed, watch, ref } from "vue";
import api from "@/api";
import { useSearchStore } from "@/stores/searchStore";
import { useRouter } from "vue-router";

const props = defineProps<{
  searchTerm: string;
}>();

const suggestions = ref<Record<string, string>>({});
const searchStore = useSearchStore();
const router = useRouter();
const hasSuggestions = computed(() => {
  return Object.keys(suggestions.value).length;
});

const suggestedSearch = computed(() => {
  // replace all original words with the suggestions
  return Object.entries(suggestions.value).reduce(
    (searchTerm, [originalWord, newWord]) =>
      replaceWord(searchTerm, originalWord, newWord),
    props.searchTerm
  );
});

const replaceWord = (text, word, newWord) => {
  const regex = new RegExp(`\\b${word}\\b`, "ig");
  return text.replace(regex, newWord);
};

async function handleSearchSuggestionClick() {
  searchStore.query = suggestedSearch.value;
  const searchId = await searchStore.getSearchId();
  router.push({
    name: "search",
    params: { searchId },
  });
}

watch(
  () => props.searchTerm,
  async () => {
    if (!props.searchTerm) return;

    suggestions.value = await api.getDidYouMeanSuggestions(props.searchTerm);
  },
  { immediate: true }
);
</script>
<style scoped></style>
