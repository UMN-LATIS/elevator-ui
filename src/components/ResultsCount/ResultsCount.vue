<template>
  <div class="results-count">
    <div v-if="total > 0" class="flex gap-2 items-baseline">
      <p class="text-sm text-neutral-500">
        <b>{{ showingCount }}</b> of <b>{{ total }}</b> results
      </p>
      <Button
        v-if="showingCount < total"
        variant="tertiary"
        @click="$emit('loadMore')"
      >
        Load More
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
import Button from "@/components/Button/Button.vue";
import SpinnerIcon from "@/icons/SpinnerIcon.vue";
import type { FetchStatus } from "@/types";
defineProps<{
  showingCount: number;
  total: number;
  status: FetchStatus;
}>();

defineEmits<{
  (event: "loadMore");
}>();
</script>
<style scoped></style>
