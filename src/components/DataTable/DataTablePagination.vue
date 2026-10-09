<template>
  <div
    v-if="pagination.total > 0"
    class="flex flex-wrap items-center justify-between gap-4 px-1 py-3">
    <p class="text-sm text-on-surface-variant">
      Showing {{ firstRowNumber.toLocaleString() }}–{{
        lastRowNumber.toLocaleString()
      }}
      of
      {{ pagination.total.toLocaleString() }}
      {{ pagination.total === 1 ? itemName.singular : itemName.plural }}
    </p>
    <PaginationRoot
      v-if="pageCount > 1"
      :page="pageShownInPager"
      :total="pagination.total"
      :itemsPerPage="pagination.perPage"
      :siblingCount="1"
      showEdges
      @update:page="emit('update:page', $event)">
      <PaginationList v-slot="{ items }" class="flex items-center gap-1">
        <PaginationPrev asChild>
          <DataTablePageButton>
            <ChevronLeftIcon class="size-4" aria-hidden="true" />
          </DataTablePageButton>
        </PaginationPrev>
        <template v-for="(item, index) in items" :key="index">
          <PaginationListItem
            v-if="item.type === 'page'"
            :value="item.value"
            asChild>
            <DataTablePageButton>{{ item.value }}</DataTablePageButton>
          </PaginationListItem>
          <PaginationEllipsis
            v-else
            :index="index"
            class="flex h-8 min-w-8 items-center justify-center text-sm text-on-surface-variant">
            …
          </PaginationEllipsis>
        </template>
        <PaginationNext asChild>
          <DataTablePageButton>
            <ChevronRightIcon class="size-4" aria-hidden="true" />
          </DataTablePageButton>
        </PaginationNext>
      </PaginationList>
    </PaginationRoot>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  PaginationEllipsis,
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev,
  PaginationRoot,
} from "reka-ui";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-vue-next";
import DataTablePageButton from "./DataTablePageButton.vue";
import type { ItemName, TablePagination } from "@/types";

const props = defineProps<{
  pagination: TablePagination;
  itemName: ItemName;
}>();

const emit = defineEmits<{
  "update:page": [page: number];
}>();

const pageCount = computed((): number =>
  Math.ceil(props.pagination.total / props.pagination.perPage)
);

const pageShownInPager = computed((): number =>
  Math.min(props.pagination.page, pageCount.value)
);

const firstRowNumber = computed(
  (): number => (pageShownInPager.value - 1) * props.pagination.perPage + 1
);

const lastRowNumber = computed((): number =>
  Math.min(
    pageShownInPager.value * props.pagination.perPage,
    props.pagination.total
  )
);
</script>
