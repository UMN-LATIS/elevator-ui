import { createColumnHelper } from "@tanstack/vue-table";
import { PencilIcon, TrashIcon } from "lucide-vue-next";
import type { PermissionsGroup } from "@/types";
import { cn } from "@/lib/utils";
import IconButton from "@/components/IconButton/IconButton.vue";
import Chip from "@/components/Chip/Chip.vue";
import { ColHeader } from "../AdminPermissionsPage/ColHeader";

export interface DrawerGroupRow {
  group: PermissionsGroup;
  name: string;
  typeLabel: string;
  entriesCount: number;
  isGlobal: boolean; // e.g. `All`, `Authed`, `Users`, ...
  isPersonal: boolean;
}

const columnHelper = createColumnHelper<DrawerGroupRow>();

export const createDrawerGroupColumns = (
  onEdit: (group: PermissionsGroup) => void,
  onDelete: (group: PermissionsGroup) => void
) => [
  columnHelper.accessor("name", {
    id: "name",
    header: () => <ColHeader text="Name" />,
    meta: { widthClass: "w-[42%]" },
    cell: (ctx) => (
      <div class="text-sm font-medium text-on-surface">{ctx.getValue()}</div>
    ),
  }),
  columnHelper.accessor("typeLabel", {
    id: "type",
    header: () => <ColHeader text="Type" />,
    meta: { widthClass: "w-[42%]" },
    cell: (ctx) => (
      <div class="text-sm text-on-surface-variant">{ctx.getValue()}</div>
    ),
  }),
  columnHelper.accessor("entriesCount", {
    id: "membersEntries",
    header: () => <ColHeader text="Members / Entries" />,
    enableColumnFilter: false,
    enableGlobalFilter: false,
    meta: { widthClass: "w-[16%]" },
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
    header: () => null,
    enableSorting: false,
    meta: { widthClass: "w-20" },
    cell: ({ row }: { row: { original: DrawerGroupRow } }) => {
      // The personal group is read-only
      if (row.original.isPersonal) {
        return null;
      }
      return (
        <div class="flex justify-end">
          <IconButton
            onClick={() => onEdit(row.original.group)}
            title="Edit Group"
            data-group-edit={row.original.group.id}
            showTooltip={false}>
            <PencilIcon class="size-4" />
          </IconButton>
          <IconButton
            onClick={() => onDelete(row.original.group)}
            title="Delete Group"
            showTooltip={false}
            class="enabled:text-error enabled:hover:bg-error-container enabled:hover:text-on-error-container">
            <TrashIcon class="size-4" />
          </IconButton>
        </div>
      );
    },
  },
];
