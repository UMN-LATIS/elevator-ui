<template>
  <div class="drawer-view-page__drawer-items-grid">
    <Draggable
      v-model="clonedMatches"
      class="grid grid-cols-auto-md gap-4"
      :itemKey="
        (item) =>
          item.excerptId
            ? `${item.objectId}-${item.excerptId}`
            : `${item.objectId}`
      "
      handle=".drag-handle"
      ghostClass="draggable-ghost"
      dragClass="is-dragging"
      :disabled="!isDraggable"
      @end="emits('dragEnd', clonedMatches)">
      <template #item="{ element }">
        <div
          class="item-container relative rounded flex items-start group shadow-sm">
          <div
            v-if="isDraggable"
            class="drag-handle cursor-move h-full py-1 rounded-l border border-r-0 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-blue-100 transition-colors">
            <DragIcon />
          </div>

          <SearchResultCard
            :id="`object-${element.objectId}`"
            :searchMatch="element"
            :showDetails="false"
            :drawerId="drawerId"
            class="search-result-card h-full flex-1 !rounded-l-none"
            :mediaCardClass="[
              'group-hover:bg-blue-50 group-hover:border-blue-600 group-hover:!text-blue-600',
              isDraggable ? 'rounded-l-none !border-l-0 shadow-none' : '',
            ]" />
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
import { DragIcon } from "@/icons";

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
.grid {
  /* give all rows the same height to avoid height change with drag/drop */
  grid-auto-rows: 1fr;
}

.drag-handle {
  background: white;
  border: var(--app-mediaCard-borderWidth) solid
    var(--app-mediaCard-borderColor);
  border-right: none;
}

.draggable-ghost {
  opacity: 0.5;
  /* border-radius: 0.25rem; */
}
.draggable-ghost::after {
  content: "";
  position: absolute;
  inset: 0;
  width: full;
  height: full;
  z-index: 20;
  background: var(--color-blue-600);
  border-radius: 0.25rem 0.25rem 0 0;
  opacity: 0.5;
}

.draggable-ghost .drag-handle {
  background: var(--color-blue-600);
  color: var(--color-blue-100);
}

.is-dragging .search-result-card {
  background: #fff;
}
</style>
