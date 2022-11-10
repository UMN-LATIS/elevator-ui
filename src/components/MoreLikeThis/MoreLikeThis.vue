<template>
  <div v-if="items.length" class="border-neutral-900 pt-6 mt-6 border-t">
    <h3 class="flex flex-wrap items-center gap-2 mb-4 text-xl font-bold">
      More Like This
      <span
        class="bg-neutral-900 text-neutral-100 inline-flex items-center px-2 py-1 text-xs font-normal rounded-full"
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
import { ref, watch } from "vue";
import { SearchResultMatch } from "@/types";
import SearchResultCard from "../SearchResultCard/SearchResultCard.vue";
import api from "@/helpers/api";

const props = defineProps<{
  assetId: string;
}>();

const items = ref<SearchResultMatch[]>([]);

watch(
  () => props.assetId,
  async () => {
    items.value = await api.getMoreLikeThis(props.assetId);
  },
  { immediate: true }
);
</script>
<style scoped></style>
