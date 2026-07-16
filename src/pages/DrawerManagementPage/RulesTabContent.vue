<template>
  <div>
    <div class="flex justify-between items-center gap-x-8 gap-y-4 flex-wrap">
      <p class="text-sm flex-1">
        Share a drawer by granting one of your groups a permission on it.
      </p>
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
                'opacity-50 pointer-events-none':
                  row.original.id === deletingRuleId,
              }">
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()" />
              </TableCell>
            </TableRow>
            <TableRow v-if="!table.getRowModel().rows.length">
              <TableCell
                :colspan="ruleColumns.length"
                class="h-16 text-center text-sm"
                :class="isError ? 'text-error' : 'text-on-surface-variant'">
                {{ emptyMessage }}
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>

    <ConfirmModal
      :isOpen="Boolean(rulePendingDelete)"
      :title="
        isDeletingAnotherOwnersRule
          ? 'Delete Someone Else’s Rule'
          : 'Delete Rule'
      "
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
        <b>{{ rulePendingDelete?.drawerTitle }}?</b>
      </p>
      <p
        v-if="isDeletingAnotherOwnersRule"
        role="alert"
        class="mt-3 flex items-start gap-2 rounded-md bg-error-container px-3 py-2 text-sm text-on-error-container">
        <TriangleAlertIcon class="mt-0.5 size-4 shrink-0" />
        <span>
          This group belongs to
          <b>{{ pendingDeleteOwnerName }}</b>
          , and everyone in it loses access immediately. You will not be able to
          put this rule back: a new rule can only use a group you own.
        </span>
      </p>
      <p v-else class="mt-3">This action cannot be undone.</p>
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
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  FilterIcon,
  TriangleAlertIcon,
} from "lucide-vue-next";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import Skeleton from "@/components/Skeleton/Skeleton.vue";
import { buildPermissionOptions } from "@/components/PermissionSelect/buildPermissionOptions";
import { useToastStore } from "@/stores/toastStore";
import { createRuleColumns } from "./RulesTableColumns";
import { buildRuleRows } from "./buildRuleRows";
import type { DrawerRuleRow } from "./buildRuleRows";
import {
  drawerGrantsQuery,
  useDeleteDrawerGrantMutation,
  useSaveDrawerGrantMutation,
} from "./drawerGrantQueries";
import { manageableDrawersQuery } from "./drawerGroupQueries";
import { permissionLevelsQuery } from "@/queries/permissionLevelsQuery";

// Placeholder rows shown while the rule list loads.
const SKELETON_ROW_COUNT = 3;

const {
  data: grants,
  isLoading: isLoadingGrants,
  isError: isGrantsError,
} = useQuery(drawerGrantsQuery());
const {
  data: drawers,
  isLoading: isLoadingDrawers,
  isError: isDrawersError,
} = useQuery(manageableDrawersQuery());
const {
  data: permissionLevels,
  isLoading: isLoadingLevels,
  isError: isLevelsError,
} = useQuery(permissionLevelsQuery());

// rows join all three sources, so any one still loading means no rows yet
const isLoading = computed(
  () => isLoadingGrants.value || isLoadingDrawers.value || isLoadingLevels.value
);

// each source falls back to [], so one failing looks identical to no rules
const isError = computed(
  () => isGrantsError.value || isDrawersError.value || isLevelsError.value
);

const ruleRows = computed(() =>
  buildRuleRows({
    grants: grants.value ?? [],
    drawers: drawers.value ?? [],
    permissionLevels: permissionLevels.value ?? [],
  })
);

const emptyMessage = computed((): string => {
  if (isError.value) return "Could not load rules.";
  if (ruleRows.value.length) return "No rules match your filters.";
  return "No rules yet.";
});

// Options for the inline permission editor.
const permissionOptions = computed(() =>
  buildPermissionOptions(permissionLevels.value ?? [])
);

// Inline permission editing: the row whose permission cell is open, plus
// the level picked in it. Only one row edits at a time.
const editingRuleId = ref<number | null>(null);
const draftLevelId = ref<number | null>(null);
const saveGrant = useSaveDrawerGrantMutation();

function startEdit(rule: DrawerRuleRow) {
  editingRuleId.value = rule.id;
  draftLevelId.value = rule.permissionLevelId;
}

function cancelEdit() {
  editingRuleId.value = null;
  draftLevelId.value = null;
}

function saveEdit(rule: DrawerRuleRow) {
  const levelId = draftLevelId.value;
  cancelEdit();
  // nothing to save when the level is unchanged
  if (levelId === null || levelId === rule.permissionLevelId) return;

  saveGrant.mutate({
    kind: "update",
    grantId: rule.id,
    permissionLevelId: levelId,
  });
}

// The row whose inline save is in flight. Its permission cell shows the
// submitted level with a spinner until the refetch lands.
const savingRuleId = computed((): number | null => {
  const input = saveGrant.variables.value;
  if (!saveGrant.isPending.value || input?.kind !== "update") return null;
  return input.grantId;
});

const savingLevelLabel = computed((): string => {
  const input = saveGrant.variables.value;
  if (input?.kind !== "update") return "";
  const submittedLevel = permissionOptions.value.find(
    (option) => option.id === input.permissionLevelId
  );
  return submittedLevel?.label ?? "";
});

const toastStore = useToastStore();
const deleteGrant = useDeleteDrawerGrantMutation();

// The row being deleted grays out until the refetch drops it.
const deletingRuleId = computed((): number | null => {
  if (!deleteGrant.isPending.value) return null;
  return deleteGrant.variables.value ?? null;
});

// the rule awaiting delete confirmation, doubling as the modal's open state
const rulePendingDelete = ref<DrawerRuleRow | null>(null);

// Managing a drawer carries the right to revoke a grant for a group the
// caller does not own, but not to recreate one: a new rule can only name
// a group they own. Deleting is one-way, so the dialog says so.
const isDeletingAnotherOwnersRule = computed((): boolean => {
  const rule = rulePendingDelete.value;
  return rule !== null && !rule.isOwnGroup;
});

const pendingDeleteOwnerName = computed(
  (): string => rulePendingDelete.value?.ownerName ?? "another user"
);

function handleDelete(rule: DrawerRuleRow) {
  rulePendingDelete.value = rule;
}

function confirmDelete() {
  const rule = rulePendingDelete.value;
  if (!rule) return;
  deleteGrant.mutate(rule.id, {
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
  });
  rulePendingDelete.value = null;
}

const ruleColumns = createRuleColumns({
  editingRuleId,
  draftLevelId,
  savingRuleId,
  savingLevelLabel,
  permissionOptions,
  onEdit: startEdit,
  onCancel: cancelEdit,
  onSave: saveEdit,
  onDelete: handleDelete,
});

const sorting = ref<SortingState>([{ id: "drawer", desc: false }]);

// One search box filters across every text column.
const searchText = ref("");

const table = useVueTable({
  get data() {
    return ruleRows.value;
  },
  columns: ruleColumns as ColumnDef<DrawerRuleRow, unknown>[],
  getRowId: (row) => String(row.id),
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
