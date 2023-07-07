<template>
  <div ref="containerRef">
    <Draggable
      v-model="clonedMatches"
      class="grid grid-cols-auto-md gap-4"
      itemKey="objectId"
      handle=".drag-handle"
      ghostClass="draggable-ghost"
      dragClass="is-dragging"
      :disabled="!isDraggable"
      @end="emits('dragEnd', clonedMatches)"
    >
      <template #item="{ element }">
        <div class="relative rounded">
          <div
            v-if="isDraggable"
            class="drag-handle cursor-move absolute top-1 left-1 p-2 z-10 rounded-tl bg-transparent-black-50 hover:bg-neutral-900 hover:text-neutral-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M7 19v-2h2v2H7m4 0v-2h2v2h-2m4 0v-2h2v2h-2m-8-4v-2h2v2H7m4 0v-2h2v2h-2m4 0v-2h2v2h-2m-8-4V9h2v2H7m4 0V9h2v2h-2m4 0V9h2v2h-2M7 7V5h2v2H7m4 0V5h2v2h-2m4 0V5h2v2h-2Z"
              />
            </svg>
          </div>

          <SearchResultCard
            :id="`object-${element.objectId}`"
            :searchMatch="element"
            :showDetails="false"
            :drawerId="drawerId"
            class="search-result-card h-full"
          />
        </div>
      </template>
    </Draggable>
  </div>
</template>
<script setup lang="ts">
import SearchResultCard from "@/components/SearchResultCard/SearchResultCard.vue";
import { computed, watch, ref } from "vue";
import { FetchStatus, SearchResultMatch } from "@/types";
import { useScroll } from "@vueuse/core";
import Draggable from "vuedraggable";

const props = withDefaults(
  defineProps<{
    totalResults?: number;
    matches: SearchResultMatch[];
    status: FetchStatus;
    drawerId?: number;
    isDraggable?: boolean;
  }>(),
  {
    totalResults: undefined,
    drawerId: undefined,
    isDraggable: false,
  }
);

const emits = defineEmits<{
  (event: "loadMore");
  (event: "dragEnd", matches: SearchResultMatch[]);
}>();

const containerRef = ref<HTMLElement | null>(null);

// Clone the matches so that we can use them with v-model
// in the draggable component
const clonedMatches = ref<SearchResultMatch[]>(props.matches);

// Update the clonedMatches when the props.matches changes
watch(
  () => props.matches,
  (matches) => {
    clonedMatches.value = matches;
  }
);

const { arrivedState } = useScroll(window, {
  offset: { bottom: 100 },
});

watch(
  arrivedState,
  (arrived) => {
    if (arrived.bottom && hasMoreResults.value && props.status !== "fetching") {
      emits("loadMore");
    }
  },
  { immediate: true }
);

const hasMoreResults = computed(() => {
  return (props.totalResults ?? Infinity) > props.matches.length;
});
</script>
<style scoped>
.draggable-ghost {
  opacity: 0.5;
  background: var(--color-blue-100);
  border-radius: 0.25rem;
}

.is-dragging .search-result-card {
  background: #fff;
}
.is-dragging .drag-handle {
  background: var(--color-neutral-900);
  color: var(--color-neutral-100);
}
</style>
