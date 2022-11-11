<template>
  <div v-if="items.length" class="more-like-this pt-6 mt-6">
    <h3
      class="more-like-this__title flex flex-wrap items-center gap-2 mb-4 text-xl font-bold"
    >
      More Like This
      <span
        class="more-like-this__count inline-flex items-center px-2 py-1 text-xs font-normal rounded-full"
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
<style scoped>
.more-like-this__title {
  color: var(--app-mediaCard-title-textColor);
}
.more-like-this__count {
  background-color: var(--app-mediaCard-backgroundColor);
  border: var(--app-mediaCard-borderWidth) solid
    var(--app-mediaCard-borderColor);
  font-weight: bold;
}
</style>
