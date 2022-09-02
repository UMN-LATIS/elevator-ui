<template>
  <div class="grid">
    <SearchResultItem
      v-for="searchResultItem in searchResults.matches"
      :key="searchResultItem.objectId"
      :searchResult="searchResultItem"
    >
    </SearchResultItem>
  </div>
</template>

<script lang="ts" setup>
import { Search } from "@/types";
import SearchResultItem from "@/SearchComponents/SearchResultItem.vue";

interface Props {
  searchResults: Search;
}

const props = defineProps<Props>();
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  grid-gap: 10px;
}
</style>
