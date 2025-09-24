<template>
  <div class="results-count">
    <div v-if="total > 0" class="flex gap-2 items-baseline">
      <p class="text-sm text-neutral-500">
        <b>{{ showingCount }}</b>
        of
        <b>{{ total }}</b>
        results
      </p>
      <Button
        v-if="showingCount < total"
        variant="tertiary"
        :class="{
          'button--load-all': canLoadAll,
          'button--load-more': !canLoadAll,
        }"
        @click="handleLoadMoreClick">
        <slot name="loadMoreButtonLabel">
          Load {{ canLoadAll ? "All" : "More" }}
        </slot>
        <SpinnerIcon
          v-show="fetchStatus === 'fetching'"
          class="w-3 h-3 text-blue-600 ml-1" />
      </Button>
    </div>
    <p
      v-if="fetchStatus !== 'fetching' && total === 0"
      class="text-sm text-neutral-500">
      No results found.
    </p>
  </div>
</template>
<script setup lang="ts">
import Button from "@/components/Button/Button.vue";
import SpinnerIcon from "@/icons/SpinnerIcon.vue";
import { FetchStatus } from "@/types";
import { computed } from "vue";

const props = defineProps<{
  showingCount: number;
  total: number;
  fetchStatus: FetchStatus;
}>();

const emit = defineEmits<{
  (eventName: "loadMore"): void;
  (eventName: "loadAll"): void;
}>();

function handleLoadMoreClick() {
  if (props.fetchStatus === "fetching") return;
  if (props.total - props.showingCount < 1000) {
    emit("loadAll");
    return;
  }
  emit("loadMore");
}

const canLoadAll = computed(() => {
  return (
    props.showingCount < props.total && props.total - props.showingCount < 1000
  );
});
</script>
<style scoped></style>
