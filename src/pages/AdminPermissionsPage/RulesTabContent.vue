<template>
  <div>
    <div class="flex justify-between items-center gap-x-8 gap-y-4 flex-wrap">
      <p class="text-sm flex-1">
        Grant groups access to all collections or a single collection.
      </p>
      <div class="flex gap-2 items-center flex-wrap">
        <InputGroup
          v-model="searchText"
          label="Search Rules"
          placeholder="Search rules"
          :labelHidden="true"
          class="max-w-sm"
          type="search"
          :disabled="isLoading">
          <template #prepend>
            <FilterIcon class="size-4 text-on-surface-variant" />
          </template>
        </InputGroup>
        <Button variant="primary" class="whitespace-nowrap" @click="openCreate">
          Create Rule
        </Button>
      </div>
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
              <TableCell v-for="(_, index) in ruleColumns" :key="index">
                <Skeleton height="1rem" width="70%" />
              </TableCell>
            </TableRow>
          </template>
          <template v-else>
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :class="{
                'opacity-50 pointer-events-none': row.id === deletingKey,
              }">
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
                {{
                  ruleRows.length
                    ? "No rules match your filters."
                    : "No rules yet."
                }}
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>

    <RuleFormModal :isOpen="isRuleModalOpen" @close="isRuleModalOpen = false" />

    <ConfirmModal
      :isOpen="Boolean(rulePendingDelete)"
      title="Delete Rule"
      type="danger"
      confirmLabel="Delete"
      @close="rulePendingDelete = null"
      @confirm="confirmDelete">
      <p>
        Are you sure you want to delete the rule granting
        <b>{{ rulePendingDelete?.groupLabel }}</b>
        the
        <b>{{ rulePendingDelete?.permissionLabel }}</b>
        permission on
        <b>{{ rulePendingDelete?.collectionLabel }}?</b>
        This action cannot be undone.
      </p>
    </ConfirmModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
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
import Button from "@/components/Button/Button.vue";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import Skeleton from "@/components/Skeleton/Skeleton.vue";
import { useToastStore } from "@/stores/toastStore";
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
  useDeleteRuleMutation,
  useSaveRuleMutation,
} from "./ruleQueries";
import { permissionLevelsQuery } from "@/queries/permissionLevelsQuery";
import { buildRuleRows, ruleRowKey } from "./buildRuleRows";
import type { PermissionRuleRow } from "./buildRuleRows";
import { buildPermissionOptions } from "@/components/PermissionSelect/buildPermissionOptions";
import { createRuleColumns } from "./RulesTableColumns";

// Placeholder rows shown while the rule lists load.
const SKELETON_ROW_COUNT = 3;

// The modal now only creates rules; editing happens inline in the table.
const isRuleModalOpen = ref(false);

function openCreate() {
  isRuleModalOpen.value = true;
}

// Inline permission editing: the row whose permission cell is open, plus
// the level picked in it. Only one row edits at a time.
const editingKey = ref<string | null>(null);
const draftLevelId = ref<number | null>(null);
const saveRule = useSaveRuleMutation();

function startEdit(rule: PermissionRuleRow) {
  editingKey.value = rule.key;
  draftLevelId.value = rule.permissionLevelId;
}

function cancelEdit() {
  editingKey.value = null;
  draftLevelId.value = null;
}

function saveEdit(rule: PermissionRuleRow) {
  const levelId = draftLevelId.value;
  cancelEdit();
  // nothing to save when the level is unchanged
  if (levelId === null || levelId === rule.permissionLevelId) return;

  saveRule.mutate({
    kind: "update",
    grantId: rule.grantId,
    rule: {
      collectionId: rule.collectionId,
      groupId: rule.groupId,
      permissionLevelId: levelId,
    },
  });
}

const toastStore = useToastStore();
const deleteRuleMutation = useDeleteRuleMutation();

// The row being deleted grays out until the refetch drops it. isPending
// holds through the refetch because onSettled returns its promise.
const deletingKey = computed((): string | null => {
  const vars = deleteRuleMutation.variables.value;
  if (!deleteRuleMutation.isPending.value || !vars) return null;
  return ruleRowKey(vars.scope, vars.grantId);
});

// the rule awaiting delete confirmation, doubling as the modal's open state
const rulePendingDelete = ref<PermissionRuleRow | null>(null);

function handleDelete(rule: PermissionRuleRow) {
  rulePendingDelete.value = rule;
}

function confirmDelete() {
  const rule = rulePendingDelete.value;
  if (!rule) return;
  deleteRuleMutation.mutate(
    { scope: rule.scope, grantId: rule.grantId },
    {
      onSuccess: () =>
        toastStore.addToast({
          message: "Rule deleted.",
          variant: "success",
        }),
      onError: (error) =>
        toastStore.addToast({
          title: "Delete Rule Failed",
          message: `Failed to delete rule: ${error.message}`,
          variant: "error",
        }),
    }
  );
  rulePendingDelete.value = null;
}

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
// list only holds collections this admin can browse, so a rule's
// collection can be missing here.
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

// Options for the inline permission editor, same source as the create modal.
const permissionOptions = computed(() =>
  buildPermissionOptions(permissionLevels.value ?? [])
);

// The row whose inline save is in flight. Its permission cell shows the
// submitted level with a spinner until the refetch lands.
const savingKey = computed((): string | null => {
  const input = saveRule.variables.value;
  if (!saveRule.isPending.value || input?.kind !== "update") return null;
  const scope = input.rule.collectionId === null ? "instance" : "collection";
  return ruleRowKey(scope, input.grantId);
});

// The level that save submitted, which the cell names in place of the
// stale one the list still holds.
const savingLevelLabel = computed((): string => {
  const input = saveRule.variables.value;
  if (input?.kind !== "update") return "";
  const submittedLevel = permissionOptions.value.find(
    (option) => option.id === input.rule.permissionLevelId
  );
  return submittedLevel?.label ?? "";
});

const ruleColumns = createRuleColumns({
  editingKey,
  draftLevelId,
  savingKey,
  savingLevelLabel,
  permissionOptions,
  onEdit: startEdit,
  onCancel: cancelEdit,
  onSave: saveEdit,
  onDelete: handleDelete,
});

// "All Collections" sorts to the top under the default ascending sort.
const sorting = ref<SortingState>([{ id: "collection", desc: false }]);

// One search box filters across every text column.
const searchText = ref("");

const table = useVueTable({
  get data() {
    return ruleRows.value;
  },
  columns: ruleColumns as ColumnDef<PermissionRuleRow, unknown>[],
  getRowId: (row) => row.key,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  globalFilterFn: "includesString",
  onSortingChange: (updater) => {
    sorting.value = functionalUpdate(updater, sorting.value);
  },
  onGlobalFilterChange: (updater) => {
    searchText.value = functionalUpdate(updater, searchText.value);
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
