<template>
  <div v-if="items.length" class="border-t border-neutral-900 mt-6 pt-6">
    <h3
      class="font-bold text-xl text-neutral-900 flex items-center gap-2 flex-wrap mb-4"
    >
      More Like This
      <span
        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-normal bg-neutral-900 text-neutral-100"
      >
        {{ items.length }}
      </span>
    </h3>

    <SearchResultCard
      v-for="searchMatch in items"
      :key="searchMatch.objectId"
      :searchMatch="searchMatch"
    />
  </div>
</template>
<script setup lang="ts">
import { SearchResultMatch } from "@/types";
import SearchResultCard from "../SearchResultCard/SearchResultCard.vue";

defineProps<{
  items: SearchResultMatch[];
}>();
</script>
<style scoped></style>
