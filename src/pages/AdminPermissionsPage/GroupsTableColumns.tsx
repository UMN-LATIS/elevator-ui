import { createColumnHelper } from "@tanstack/vue-table";
import type { RowData } from "@tanstack/vue-table";
import { PencilIcon, TrashIcon } from "lucide-vue-next";
import type { PermissionsGroup } from "@/types";
import { cn } from "@/lib/utils";
import IconButton from "@/components/IconButton/IconButton.vue";
import Chip from "@/components/Chip/Chip.vue";
import ChevronRightIcon from "@/icons/ChevronRightIcon.vue";
import { ColHeader } from "./ColHeader";

declare module "@tanstack/vue-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    // Placeholder for the filter input rendered above this column's header.
    filterPlaceholder?: string;
  }
}

// One row of the groups table: a group joined with its type's display
// strings so sorting and filtering work on what the admin sees.
export interface GroupRow {
  group: PermissionsGroup;
  name: string;
  typeLabel: string;
  description: string;
  entriesCount: number;
  // Global groups (All, Authenticated) match everyone, so there is no
  // member or entry list to show a count for.
  isGlobal: boolean;
}

const columnHelper = createColumnHelper<GroupRow>();

export const createGroupColumns = (
  onEdit: (group: PermissionsGroup) => void,
  onDelete: (group: PermissionsGroup) => void
) => [
  columnHelper.display({
    id: "expander",
    header: () => null,
    enableSorting: false,
    cell: ({ row }) =>
      row.getCanExpand() ? (
        <button
          type="button"
          data-group-trigger={row.original.group.id}
          aria-expanded={row.getIsExpanded()}
          aria-label={`Toggle details for ${row.original.name}`}
          class="flex size-8 items-center justify-center rounded-full hover:bg-surface-container-highest focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={row.getToggleExpandedHandler()}>
          <ChevronRightIcon
            class={cn(
              "!size-4 text-on-surface-variant transition-transform",
              row.getIsExpanded() && "rotate-90"
            )}
          />
        </button>
      ) : null,
    maxSize: 48,
  }),
  columnHelper.accessor("name", {
    id: "name",
    header: () => <ColHeader text="Name" />,
    meta: { filterPlaceholder: "Filter name" },
    cell: (ctx) => (
      <div class="text-sm font-medium text-on-surface">{ctx.getValue()}</div>
    ),
  }),
  columnHelper.accessor("typeLabel", {
    id: "type",
    header: () => <ColHeader text="Type" />,
    meta: { filterPlaceholder: "Filter type" },
    cell: (ctx) => (
      <div class="text-sm text-on-surface-variant">{ctx.getValue()}</div>
    ),
  }),
  columnHelper.accessor("entriesCount", {
    id: "membersEntries",
    header: () => <ColHeader text="Members / Entries" />,
    enableColumnFilter: false,
    enableGlobalFilter: false,
    cell: (ctx) =>
      ctx.row.original.isGlobal ? (
        <div class="text-sm text-on-surface-variant">—</div>
      ) : (
        <Chip
          class={cn(
            "border border-outline-variant",
            ctx.getValue() > 0
              ? "bg-secondary-container"
              : "bg-transparent text-on-surface-variant"
          )}>
          {ctx.getValue()}
        </Chip>
      ),
  }),
  {
    id: "actions",
    header: () => <ColHeader text="" />,
    enableSorting: false,
    cell: ({ row }: { row: { original: GroupRow } }) => (
      <div class="flex justify-end">
        <IconButton
          onClick={() => onEdit(row.original.group)}
          title="Edit Group"
          showTooltip={false}>
          <PencilIcon class="size-4" />
        </IconButton>
        <IconButton
          onClick={() => onDelete(row.original.group)}
          title="Delete Group"
          showTooltip={false}
          class="enabled:hover:bg-error-container enabled:hover:text-on-error-container">
          <TrashIcon class="size-4" />
        </IconButton>
      </div>
    ),
    maxSize: 96,
  },
];
