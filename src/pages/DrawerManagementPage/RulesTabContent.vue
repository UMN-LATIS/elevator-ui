<template>
  <div>
    <div class="flex flex-wrap items-end gap-x-3 gap-y-4">
      <MultiSelect
        v-model="drawerIds"
        label="Drawer"
        placeholder="All drawers"
        searchPlaceholder="Search drawers…"
        emptyText="No drawers in these rules"
        class="min-w-40 flex-1 sm:w-44 sm:flex-none"
        :sections="drawerFilterSections" />
      <MultiSelect
        v-model="groupIds"
        label="Group"
        placeholder="All groups"
        searchPlaceholder="Search groups…"
        emptyText="No groups in these rules"
        class="min-w-40 flex-1 sm:w-44 sm:flex-none"
        :sections="groupFilterSections" />
      <SegmentedControl
        v-model="groupOwner"
        label="Group owner"
        labelClass="text-xs uppercase font-medium"
        optionClass="py-2 text-sm"
        class="flex-col items-start gap-1"
        :options="GROUP_OWNER_OPTIONS" />

      <div class="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
        <InputGroup
          v-model="searchText"
          label="Search Rules"
          placeholder="Search rules"
          :labelHidden="true"
          class="flex-1 sm:w-52"
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

    <div v-if="isFiltered" class="mt-3">
      <Button variant="tertiary" @click="clearFilters">Clear filters</Button>
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
        <b>{{ rulePendingDelete?.drawerTitle }}?</b>
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
import MultiSelect from "@/components/MultiSelect/MultiSelect.vue";
import type { MultiSelectSection } from "@/components/MultiSelect/MultiSelect.vue";
import SegmentedControl from "@/components/SegmentedControl/SegmentedControl.vue";
import Skeleton from "@/components/Skeleton/Skeleton.vue";
import { buildPermissionOptions } from "@/components/PermissionSelect/buildPermissionOptions";
import { useInstanceStore } from "@/stores/instanceStore";
import { useToastStore } from "@/stores/toastStore";
import RuleFormModal from "./RuleFormModal.vue";
import { createRuleColumns } from "./RulesTableColumns";
import type { SavingRule } from "./RulesTableColumns";
import { buildRuleRows } from "./buildRuleRows";
import type { DrawerRuleRow } from "./buildRuleRows";
import {
  drawerGrantsQuery,
  useDeleteDrawerGrantMutation,
  useUpdateDrawerGrantMutation,
} from "./drawerGrantQueries";
import { manageableDrawersQuery } from "./drawerGroupQueries";
import {
  filterRuleRows,
  toDrawerOption,
  toFilterOptions,
  toGroupOption,
} from "./ruleFilters";
import type { GroupOwnerFilter } from "./ruleFilters";
import { useRuleFilters } from "./useRuleFilters";
import { permissionLevelsQuery } from "@/queries/permissionLevelsQuery";
import type { SelectOption } from "@/types";

const SKELETON_ROW_COUNT = 3;

const GROUP_OWNER_OPTIONS: SelectOption<GroupOwnerFilter>[] = [
  { id: "mine", label: "Me" },
  { id: "others", label: "Others" },
  { id: "all", label: "All" },
];

// the modal only creates rules, editing is inline in the table
const isRuleModalOpen = ref(false);

function openCreate() {
  isRuleModalOpen.value = true;
}

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

const {
  groupOwner,
  drawerIds,
  groupIds,
  filters,
  isFiltered,
  clear: clearFilters,
} = useRuleFilters();

const visibleRules = computed((): DrawerRuleRow[] =>
  filterRuleRows(ruleRows.value, filters.value)
);

// Only what the rules actually reach is worth offering: a drawer with no
// rule filters the table down to nothing, and the drawer list can run to
// every drawer in the instance for an admin.
const drawerFilterSections = computed((): MultiSelectSection[] => [
  { options: toFilterOptions(ruleRows.value, toDrawerOption) },
]);

// Whose group it is decides what you can do with its rules, so the two
// kinds are worth telling apart while picking.
const groupFilterSections = computed((): MultiSelectSection[] => {
  const ownGroupRules = ruleRows.value.filter((rule) => rule.isOwnGroup);
  const otherGroupRules = ruleRows.value.filter((rule) => !rule.isOwnGroup);

  return [
    {
      label: "My Groups",
      options: toFilterOptions(ownGroupRules, toGroupOption),
    },
    {
      label: "Other Groups",
      options: toFilterOptions(otherGroupRules, toGroupOption),
    },
  ];
});

const emptyMessage = computed((): string => {
  if (isError.value) return "Could not load rules.";
  // the table renders this only when no row is visible, so rules that
  // exist are rules a filter hid
  const isFilterHidingEveryRule = ruleRows.value.length > 0;
  if (isFilterHidingEveryRule) return "No rules match your filters.";
  return "No rules yet.";
});

// A rule for a group the caller does not own cannot be deleted, so the
// editor offers No Permissions as the way to revoke one in place.
const permissionOptions = computed(() =>
  buildPermissionOptions(permissionLevels.value ?? [], {
    includesNoPermissions: true,
  })
);

// only one row edits at a time
const editingRuleId = ref<number | null>(null);
const draftLevelId = ref<number | null>(null);
const updateGrant = useUpdateDrawerGrantMutation();

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
  if (levelId === null || levelId === rule.permissionLevelId) return;

  updateGrant.mutate({ grantId: rule.id, permissionLevelId: levelId });
}

// The row whose inline save is in flight, with the level it submitted.
// Its permission cell shows that level rather than the stale one the
// list still holds until the refetch lands.
const savingRule = computed((): SavingRule | null => {
  const vars = updateGrant.variables.value;
  if (!updateGrant.isPending.value || !vars) return null;

  const submittedLevel = permissionOptions.value.find(
    (option) => option.id === vars.permissionLevelId
  );
  return { id: vars.grantId, levelLabel: submittedLevel?.label ?? "" };
});

const toastStore = useToastStore();
const deleteGrant = useDeleteDrawerGrantMutation();

// the rule being deleted
const deletingRuleId = computed((): number | null => {
  if (!deleteGrant.isPending.value) return null;
  return deleteGrant.variables.value ?? null;
});

// the rule awaiting delete confirmation, doubling as the modal's open state
const rulePendingDelete = ref<DrawerRuleRow | null>(null);

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

const instanceStore = useInstanceStore();

// The API lets an admin delete any grant, matching canManageEveryDrawer
// there. A manager is held to their own groups, which they could put
// back.
const canDeleteAnyRule = computed((): boolean => {
  const currentUser = instanceStore.currentUser;
  return Boolean(currentUser?.isAdmin || currentUser?.isSuperAdmin);
});

const ruleColumns = createRuleColumns({
  editingRuleId,
  draftLevelId,
  savingRule,
  canDeleteAnyRule,
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
    return visibleRules.value;
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
