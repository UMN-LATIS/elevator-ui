<template>
  <div>
    <Draggable
      v-model="clonedMatches"
      class="flex flex-col gap-2"
      itemKey="objectId"
      handle=".drag-handle"
      ghostClass="draggable-ghost"
      dragClass="is-dragging"
      :disabled="!isDraggable"
      @end="emits('dragEnd', clonedMatches)"
    >
      <template #item="{ element }">
        <div class="item-container relative rounded flex group shadow-sm">
          <div
            v-if="isDraggable"
            class="drag-handle cursor-move py-1 rounded-l group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-blue-100 transition-colors bg-white"
          >
            <DragIcon />
          </div>
          <SearchResultRow
            :id="`object-${element.objectId}`"
            :key="element.objectId"
            :searchMatch="element"
            :showDetails="false"
            class="search-result-row flex-1"
            :class="{
              'rounded-l-none border-l-none': isDraggable,
            }"
          />
        </div>
      </template>
    </Draggable>
  </div>
</template>
<script setup lang="ts">
import { computed, watch, ref } from "vue";
import { FetchStatus, SearchResultMatch } from "@/types";
import { useScroll } from "@vueuse/core";
import SearchResultRow from "@/components/SearchResultRow/SearchResultRow.vue";
import Draggable from "vuedraggable";
import { DragIcon } from "@/icons";

const props = withDefaults(
  defineProps<{
    totalResults?: number;
    matches: SearchResultMatch[];
    status: FetchStatus;
    isDraggable?: boolean;
  }>(),
  {
    totalResults: undefined,
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

.is-dragging .search-result-row {
  background: #fff;
}
</style>
