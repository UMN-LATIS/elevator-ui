<template>
  <div>
    <div class="flex justify-between items-center gap-x-8 gap-y-4 flex-wrap">
      <p class="text-sm flex-1">
        Grant groups access to all collections or a single collection.
      </p>
      <Button
        variant="primary"
        class="whitespace-nowrap"
        @click="isRuleModalOpen = true">
        Create Rule
      </Button>
    </div>

    <div class="mt-4 border border-outline-variant rounded-md">
      <Table class="w-full">
        <TableHeader>
          <TableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id">
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              class="bg-surface-container-low"
              :class="{
                'cursor-pointer select-none': header.column.getCanSort(),
              }"
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
        </TableHeader>
        <TableBody>
          <template v-if="isLoading">
            <TableRow
              v-for="row in SKELETON_ROW_COUNT"
              :key="`skeleton-${row}`">
              <TableCell v-for="(_, index) in ruleColumns" :key="index">
                <Skeleton height="1rem" width="70%" />
              </TableCell>
            </TableRow>
          </template>
          <template v-else>
            <TableRow v-for="row in table.getRowModel().rows" :key="row.id">
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()" />
              </TableCell>
            </TableRow>
            <TableRow v-if="!table.getRowModel().rows?.length">
              <TableCell
                :colspan="ruleColumns.length"
                class="h-16 text-center text-sm text-on-surface-variant">
                No rules yet.
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>

    <RuleFormModal :isOpen="isRuleModalOpen" @close="isRuleModalOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useQuery } from "@tanstack/vue-query";
import type { SortingState } from "@tanstack/vue-table";
import {
  FlexRender,
  getCoreRowModel,
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
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-vue-next";
import Button from "@/components/Button/Button.vue";
import Skeleton from "@/components/Skeleton/Skeleton.vue";
import RuleFormModal from "./RuleFormModal.vue";
import { useInstanceQuery } from "@/queries/useInstanceQuery";
import {
  flattenCollections,
  normalizeAssetCollections,
} from "@/helpers/collectionHelpers";
import { groupsQuery } from "./groupQueries";
import {
  collectionGrantsQuery,
  instanceGrantsQuery,
  permissionLevelsQuery,
} from "./ruleQueries";
import { buildRuleRows } from "./buildRuleRows";
import { ruleColumns } from "./RulesTableColumns";

// Placeholder rows shown while the rule lists load.
const SKELETON_ROW_COUNT = 3;

const isRuleModalOpen = ref(false);

const { data: instanceGrants, isLoading: isLoadingInstanceGrants } = useQuery(
  instanceGrantsQuery()
);
const { data: collectionGrants, isLoading: isLoadingCollectionGrants } =
  useQuery(collectionGrantsQuery());
const { data: permissionLevels, isLoading: isLoadingLevels } = useQuery(
  permissionLevelsQuery()
);
const { data: groups, isLoading: isLoadingGroups } = useQuery(groupsQuery());
const { data: instanceNav, isLoading: isLoadingNav } = useInstanceQuery();

// Rows join grants against groups, levels, and collection titles, so the
// table skeletons until every source is in.
const isLoading = computed(
  () =>
    isLoadingInstanceGrants.value ||
    isLoadingCollectionGrants.value ||
    isLoadingLevels.value ||
    isLoadingGroups.value ||
    isLoadingNav.value
);

// Breadcrumb titles ("Parent › Child") for the collection column. The nav
// list only holds collections this admin can browse, so any other
// collection's rule falls back to "Collection {id}".
const collectionTitleById = computed(() => {
  const flat = flattenCollections(
    normalizeAssetCollections(instanceNav.value?.collections ?? [])
  );
  return new Map(flat.map((collection) => [collection.id, collection.title]));
});

const ruleRows = computed(() =>
  buildRuleRows({
    instanceGrants: instanceGrants.value ?? [],
    collectionGrants: collectionGrants.value ?? [],
    groups: groups.value ?? [],
    permissionLevels: permissionLevels.value ?? [],
    collectionTitleById: collectionTitleById.value,
  })
);

// "All Collections" sorts to the top under the default ascending sort.
const sorting = ref<SortingState>([{ id: "collection", desc: false }]);

const table = useVueTable({
  get data() {
    return ruleRows.value;
  },
  columns: ruleColumns,
  getRowId: (row) => row.key,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  onSortingChange: (updater) => {
    sorting.value =
      typeof updater === "function" ? updater(sorting.value) : updater;
  },
  state: {
    get sorting() {
      return sorting.value;
    },
  },
});
</script>
