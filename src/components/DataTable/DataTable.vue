<template>
  <div>
    <div
      v-if="hasToolbar"
      class="mb-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <div class="flex min-w-48 grow basis-0 items-center gap-2">
        <slot name="toolbarStart" />
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <InputGroup
          v-if="isSearchable"
          :modelValue="searchText"
          :label="`Search ${itemName.plural}`"
          :placeholder="`Search ${itemName.plural}`"
          :labelHidden="true"
          type="search"
          class="max-w-sm"
          :disabled="status === 'pending'"
          @update:modelValue="search">
          <template #prepend>
            <SearchIcon class="size-4 text-on-surface-variant" />
          </template>
        </InputGroup>
        <slot name="toolbarEnd" />
      </div>
    </div>

    <div class="border border-outline-variant rounded-md">
      <Table class="w-full table-fixed">
        <TableHeader>
          <TableRow>
            <DataTableHead
              v-if="slots.detail"
              :column="EXPAND_COLUMN"
              class="bg-surface-container-low" />
            <DataTableHead
              v-for="column in visibleColumns"
              :key="column.id"
              :sort="sort"
              :column="column"
              class="bg-surface-container-low"
              @update:sort="sortBy" />
          </TableRow>
        </TableHeader>

        <TableBody v-if="status === 'pending'">
          <TableLoading :colspan="columnCount">
            Loading {{ itemName.plural }}…
          </TableLoading>
        </TableBody>
        <TableBody v-else-if="status === 'error'">
          <TableRow>
            <TableCell
              :colspan="columnCount"
              role="alert"
              class="h-16 text-center text-sm text-error">
              Could not load {{ itemName.plural }}.
            </TableCell>
          </TableRow>
        </TableBody>
        <TableBody v-else class="[&>tr:last-child]:border-0">
          <template v-for="row in visibleRows" :key="row.id">
            <TableRow
              :data-row-id="row.id"
              tabindex="-1"
              :aria-current="isJustSaved(row) ? 'true' : undefined"
              :inert="isRowDeleting(row)"
              :class="{
                'border-b-transparent': isExpanded(row),
                'opacity-50': isRowDeleting(row),
                'data-table-row--just-saved': isJustSaved(row),
              }"
              @animationend.self="clearJustSaved">
              <TableCell v-if="slots.detail" class="px-1">
                <button
                  v-if="canExpand(row)"
                  type="button"
                  :aria-expanded="isExpanded(row)"
                  :aria-label="detailsToggleLabel(row)"
                  class="flex size-8 items-center justify-center rounded-full hover:bg-surface-container-highest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  @click="toggleExpanded(row)">
                  <ChevronRightIcon
                    class="!size-4 text-on-surface-variant transition-transform"
                    :class="{ 'rotate-90': isExpanded(row) }" />
                </button>
              </TableCell>
              <TableCell v-for="column in visibleColumns" :key="column.id">
                <slot :name="`cell-${column.id}`" :row="row" />
              </TableCell>
            </TableRow>
            <Transition name="data-table-detail">
              <TableRow
                v-if="isExpanded(row)"
                :inert="isRowDeleting(row)"
                :class="{ 'data-table-row--just-saved': isJustSaved(row) }">
                <TableCell :colspan="columnCount" class="p-0">
                  <div class="data-table-detail__height grid">
                    <div class="min-h-0">
                      <div class="px-4 pb-4 pl-12">
                        <slot name="detail" :row="row" />
                      </div>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </Transition>
          </template>
          <TableRow v-if="!visibleRows.length">
            <TableCell
              :colspan="columnCount"
              class="h-16 text-center text-sm text-on-surface-variant">
              <template v-if="rows.length">
                No {{ itemName.plural }} match your search.
              </template>
              <template v-else-if="isFiltered">
                No {{ itemName.plural }} match the filter.
              </template>
              <template v-else>No {{ itemName.plural }} yet.</template>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
    <DataTablePagination
      v-if="pagination"
      :pagination="pagination"
      :itemName="itemName"
      @update:page="emit('update:page', $event)" />
  </div>
</template>

<script setup lang="ts" generic="TRow extends { id: string | number }">
import { computed, ref, shallowRef } from "vue";
import type { QueryStatus } from "@tanstack/vue-query";
import { SearchIcon } from "lucide-vue-next";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableLoading,
  TableRow,
} from "@/components/ui/table";
import { tryFocus } from "@/helpers/tryFocus";
import ChevronRightIcon from "@/icons/ChevronRightIcon.vue";
import DataTableHead from "./DataTableHead.vue";
import DataTablePagination from "./DataTablePagination.vue";
import { defaultSortOf, searchRows, sortRows } from "./tableRows";
import type {
  DataTableColumn,
  ItemName,
  SearchableValue,
  TablePagination,
  TableSort,
} from "@/types";

const props = withDefaults(
  defineProps<{
    itemName: ItemName;
    rows: TRow[];
    columns: DataTableColumn<TRow>[];
    status?: QueryStatus;
    isFiltered?: boolean;
    canExpand?: (row: TRow) => boolean;
    rowName?: (row: TRow) => string;
    isRowDeleting?: (row: TRow) => boolean;
    pagination?: TablePagination;
  }>(),
  {
    status: "success",
    isFiltered: false,
    canExpand: () => false,
    rowName: undefined,
    isRowDeleting: () => false,
    pagination: undefined,
  }
);

const emit = defineEmits<{
  "update:page": [page: number];
}>();

const slots = defineSlots<{
  [cellSlot: `cell-${string}`]: (props: { row: TRow }) => unknown;
  detail?: (props: { row: TRow }) => unknown;
  toolbarStart?: () => unknown;
  toolbarEnd?: () => unknown;
}>();

const sort = ref<TableSort | null>(defaultSortOf(props.columns));
const searchText = ref("");
const expandedRowIds = shallowRef<ReadonlySet<TRow["id"]>>(new Set());
const justSavedRowId = ref<TRow["id"] | null>(null);

const visibleColumns = computed(() =>
  props.columns.filter((column) => !column.isHidden)
);

const EXPAND_COLUMN: DataTableColumn<TRow> = {
  id: "expand",
  label: "Details",
  isLabelHidden: true,
  width: "xs",
};

const columnCount = computed(
  (): number => visibleColumns.value.length + (slots.detail ? 1 : 0)
);

const isSearchable = computed((): boolean =>
  visibleColumns.value.some((column) => column.searchValue)
);

const hasToolbar = computed(
  (): boolean =>
    isSearchable.value ||
    Boolean(slots.toolbarStart) ||
    Boolean(slots.toolbarEnd)
);

function searchableValuesOf(row: TRow): SearchableValue[] {
  return visibleColumns.value.flatMap((column) =>
    column.searchValue ? [column.searchValue(row)].flat() : []
  );
}

const searchedRows = computed(() =>
  searchRows(props.rows, searchText.value, searchableValuesOf)
);

const visibleRows = computed(() =>
  sortRows(searchedRows.value, visibleColumns.value, sort.value)
);

function detailsToggleLabel(row: TRow): string {
  const name = props.rowName ? props.rowName(row) : props.itemName.singular;
  return `Toggle details for ${name}`;
}

function isExpanded(row: TRow): boolean {
  return expandedRowIds.value.has(row.id);
}

function isJustSaved(row: TRow): boolean {
  return row.id === justSavedRowId.value;
}

function clearJustSaved(): void {
  justSavedRowId.value = null;
}

function expandRow(rowId: TRow["id"]): void {
  expandedRowIds.value = new Set(expandedRowIds.value).add(rowId);
}

function toggleExpanded(row: TRow): void {
  clearJustSaved();
  if (!isExpanded(row)) {
    expandRow(row.id);
    return;
  }
  const remaining = new Set(expandedRowIds.value);
  remaining.delete(row.id);
  expandedRowIds.value = remaining;
}

function sortBy(nextSort: TableSort | null): void {
  clearJustSaved();
  sort.value = nextSort;
}

function search(text: string): void {
  clearJustSaved();
  searchText.value = text;
}

async function reveal(
  rowId: TRow["id"],
  { expand = false }: { expand?: boolean } = {}
): Promise<HTMLElement | null> {
  searchText.value = "";
  justSavedRowId.value = rowId;
  if (expand) expandRow(rowId);

  try {
    return await tryFocus(`[data-row-id="${rowId}"]`);
  } catch (error) {
    console.warn(`Could not focus the ${props.itemName.singular}`, error);
    return null;
  }
}

defineExpose({ reveal });
</script>

<style scoped>
.data-table-detail-enter-active,
.data-table-detail-leave-active {
  transition: opacity 0.3s ease;
}

.data-table-detail-enter-active .data-table-detail__height,
.data-table-detail-leave-active .data-table-detail__height {
  transition: grid-template-rows 0.3s ease;
}

.data-table-detail-enter-active .data-table-detail__height > div,
.data-table-detail-leave-active .data-table-detail__height > div {
  overflow: hidden;
}

.data-table-detail__height {
  grid-template-rows: 1fr;
}

.data-table-detail-enter-from,
.data-table-detail-leave-to {
  opacity: 0;
}

.data-table-detail-enter-from .data-table-detail__height,
.data-table-detail-leave-to .data-table-detail__height {
  grid-template-rows: 0fr;
}

@media (prefers-reduced-motion: reduce) {
  .data-table-detail-enter-active,
  .data-table-detail-leave-active,
  .data-table-detail-enter-active .data-table-detail__height,
  .data-table-detail-leave-active .data-table-detail__height {
    transition: none;
  }
}

.data-table-row--just-saved {
  animation: just-saved-flash 0.5s ease-out;
}

@keyframes just-saved-flash {
  from {
    background-color: var(--primary-muted);
  }
  to {
    background-color: transparent;
  }
}
</style>
