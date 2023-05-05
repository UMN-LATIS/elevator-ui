<template>
  <div class="results-count">
    <div v-if="total > 0" class="flex gap-2 items-baseline">
      <p class="text-sm text-neutral-500">
        <b>{{ showingCount }}</b> of <b>{{ total }}</b> results
      </p>
      <Button
        v-if="showingCount < total"
        variant="tertiary"
        @click="searchStore.loadMore({ loadAll: true })"
      >
        <slot name="loadMoreButtonLabel">
          Load {{ total - showingCount < 1000 ? "All" : "More" }}
        </slot>
        <SpinnerIcon
          v-show="status === 'fetching'"
          class="w-3 h-3 text-blue-600 ml-1"
        />
      </Button>
    </div>
    <p
      v-if="status !== 'fetching' && total === 0"
      class="text-sm text-neutral-500"
    >
      No results found.
    </p>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import Button from "@/components/Button/Button.vue";
import SpinnerIcon from "@/icons/SpinnerIcon.vue";
import { useSearchStore } from "@/stores/searchStore";
const searchStore = useSearchStore();

const total = computed(() => searchStore.totalResults ?? 0);
const showingCount = computed(() => searchStore.matches.length);
const status = computed(() => searchStore.status);
</script>
<style scoped></style>
