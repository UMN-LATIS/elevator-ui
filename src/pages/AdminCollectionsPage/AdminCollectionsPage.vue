<template>
  <AdminLayout>
    <PageContent class="max-w-screen-lg">
      <PageHeader
        title="Collections"
        description="Organize this instance's assets into collections" />

      <div class="flex justify-end items-center gap-2 flex-wrap">
        <InputGroup
          v-model="searchText"
          label="Search Collections"
          placeholder="Search collections"
          :labelHidden="true"
          class="max-w-sm"
          type="search"
          :disabled="isLoading">
          <template #prepend>
            <FilterIcon class="size-4 text-on-surface-variant" />
          </template>
        </InputGroup>
        <Button
          variant="primary"
          class="whitespace-nowrap"
          :to="{ name: 'adminCollectionsCreate' }">
          Create Collection
        </Button>
      </div>

      <div class="mt-4 border border-outline-variant rounded-md">
        <Table class="w-full table-fixed">
          <TableHeader>
            <template
              v-for="headerGroup in table.getHeaderGroups()"
              :key="headerGroup.id">
              <TableRow class="hover:bg-transparent">
                <TableHead
                  v-for="header in headerGroup.headers"
                  :key="header.id"
                  class="bg-surface-container-low"
                  :class="[
                    header.column.columnDef.meta?.widthClass,
                    {
                      'cursor-pointer select-none': header.column.getCanSort(),
                    },
                  ]"
                  @click="header.column.getToggleSortingHandler()?.($event)">
                  <div class="flex items-center gap-2">
                    <FlexRender
                      v-if="!header.isPlaceholder"
                      :render="header.column.columnDef.header"
                      :props="header.getContext()" />
                    <template v-if="header.column.getCanSort()">
                      <ArrowUpDown
                        v-if="!header.column.getIsSorted()"
                        class="h-4 w-4 text-on-surface-muted" />
                      <ArrowUp
                        v-else-if="header.column.getIsSorted() === 'asc'"
                        class="h-4 w-4 text-primary" />
                      <ArrowDown v-else class="h-4 w-4 text-primary" />
                    </template>
                  </div>
                </TableHead>
              </TableRow>
            </template>
          </TableHeader>
          <TableBody>
            <template v-if="isLoading">
              <TableRow
                v-for="row in SKELETON_ROW_COUNT"
                :key="`skeleton-${row}`">
                <TableCell v-for="(_, index) in collectionColumns" :key="index">
                  <Skeleton height="1rem" width="70%" />
                </TableCell>
              </TableRow>
            </template>
            <template v-else>
              <TableRow
                v-for="row in table.getRowModel().rows"
                :key="row.id"
                :class="{
                  'opacity-50 pointer-events-none':
                    row.original.id === deletingId,
                }">
                <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                  <FlexRender
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()" />
                </TableCell>
              </TableRow>
              <TableRow v-if="!table.getRowModel().rows?.length">
                <TableCell
                  :colspan="collectionColumns.length"
                  class="h-16 text-center text-sm text-on-surface-variant">
                  {{
                    collectionRows.length
                      ? "No collections match your filters."
                      : "No collections yet."
                  }}
                </TableCell>
              </TableRow>
            </template>
          </TableBody>
        </Table>
      </div>

      <ConfirmModal
        :isOpen="Boolean(collectionPendingDelete)"
        title="Delete Collection"
        type="danger"
        confirmLabel="Delete"
        @close="collectionPendingDelete = null"
        @confirm="confirmDelete">
        <p>
          Are you sure you want to delete
          <b>{{ collectionPendingDelete?.title }}?</b>
          <template v-if="collectionPendingDelete?.hasChildren">
            Its sub-collections will move to the top level.
          </template>
          This action cannot be undone.
        </p>
      </ConfirmModal>
    </PageContent>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useQuery } from "@tanstack/vue-query";
import type { ColumnDef, SortingState } from "@tanstack/vue-table";
import {
  FlexRender,
  functionalUpdate,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useVueTable,
} from "@tanstack/vue-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDown, ArrowUp, ArrowUpDown, FilterIcon } from "lucide-vue-next";
import AdminLayout from "@/layouts/AdminLayout.vue";
import PageContent from "@/components/PageContent/PageContent.vue";
import PageHeader from "@/components/PageHeader/PageHeader.vue";
import Button from "@/components/Button/Button.vue";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import Skeleton from "@/components/Skeleton/Skeleton.vue";
import { useToastStore } from "@/stores/toastStore";
import {
  adminCollectionsQuery,
  useDeleteCollectionMutation,
} from "./adminCollectionQueries";
import { buildCollectionRows } from "./buildCollectionRows";
import type { CollectionRow } from "./buildCollectionRows";
import { createCollectionColumns } from "./CollectionsTableColumns";

const SKELETON_ROW_COUNT = 3;

const router = useRouter();
const toastStore = useToastStore();

const { data: collections, isLoading } = useQuery(adminCollectionsQuery());

const collectionRows = computed(() =>
  buildCollectionRows(collections.value ?? [])
);

function openEdit(collection: CollectionRow) {
  router.push({
    name: "adminCollectionsEdit",
    params: { id: collection.id },
  });
}

const deleteCollectionMutation = useDeleteCollectionMutation();

// the collection being deleted
const deletingId = computed((): number | null => {
  if (!deleteCollectionMutation.isPending.value) return null;
  return deleteCollectionMutation.variables.value ?? null;
});

// doubles as the confirm modal's open state
const collectionPendingDelete = ref<CollectionRow | null>(null);

function askToDeleteCollection(collection: CollectionRow) {
  collectionPendingDelete.value = collection;
}

function confirmDelete() {
  const collection = collectionPendingDelete.value;
  if (!collection) return;
  deleteCollectionMutation.mutate(collection.id, {
    onSuccess: () =>
      toastStore.addToast({
        message: "Collection deleted.",
        variant: "success",
      }),
    onError: (error) =>
      toastStore.addToast({
        title: "Delete Collection Failed",
        message: `Failed to delete collection: ${error.message}`,
        variant: "error",
      }),
  });
  collectionPendingDelete.value = null;
}

const collectionColumns = createCollectionColumns({
  onEdit: openEdit,
  onDelete: askToDeleteCollection,
});

const sorting = ref<SortingState>([{ id: "title", desc: false }]);

const searchText = ref("");

const table = useVueTable({
  get data() {
    return collectionRows.value;
  },
  columns: collectionColumns as ColumnDef<CollectionRow, unknown>[],
  getRowId: (row) => String(row.id),
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  globalFilterFn: "includesString",
  onSortingChange: (updater) => {
    sorting.value = functionalUpdate(updater, sorting.value);
  },
  state: {
    get sorting() {
      return sorting.value;
    },
    get globalFilter() {
      return searchText.value;
    },
  },
});
</script>
