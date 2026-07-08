import { createColumnHelper } from "@tanstack/vue-table";
import { RouterLink } from "vue-router";
import { PencilIcon, TrashIcon } from "lucide-vue-next";
import { cn } from "@/lib/utils";
import IconButton from "@/components/IconButton/IconButton.vue";
import type { PermissionRuleRow } from "./buildRuleRows";
import { ColHeader } from "./ColHeader";
import Chip from "@/components/Chip/Chip.vue";
import { PERM } from "@/types";

const columnHelper = createColumnHelper<PermissionRuleRow>();

const dotClassByLevel: Record<number, string> = {
  [PERM.NOPERM]: "bg-gray-500",
  // read
  [PERM.SEARCH]: "bg-green-500",
  [PERM.VIEWDERIVATIVES]: "bg-green-500",
  [PERM.DERIVATIVES_GROUP_2]: "bg-green-500",
  // write
  [PERM.CREATEDRAWERS]: "bg-yellow-500",
  [PERM.ORIGINALS]: "bg-yellow-500",
  // admin
  [PERM.ADDASSETS]: "bg-orange-500",
  [PERM.ADMIN]: "bg-red-500",
};

const scopeLabelByScope: Record<PermissionRuleRow["scope"], string> = {
  instance: "Instance",
  collection: "Collection",
};

const scopeChipClassByScope: Record<PermissionRuleRow["scope"], string> = {
  instance: "bg-secondary-container text-on-secondary-container",
  collection: "bg-tertiary-container text-on-tertiary-container",
};

export const createRuleColumns = (
  onEdit: (rule: PermissionRuleRow) => void,
  onDelete: (rule: PermissionRuleRow) => void
) => [
  columnHelper.accessor("scope", {
    id: "scope",
    header: () => <ColHeader text="Scope" />,
    enableColumnFilter: false,
    meta: { widthClass: "w-[15%]" },
    cell: (ctx) => (
      <Chip
        class={cn(
          "border border-outline-variant bg-surface-container",
          scopeChipClassByScope[ctx.getValue()]
        )}>
        {scopeLabelByScope[ctx.getValue()]}
      </Chip>
    ),
  }),
  columnHelper.accessor(
    // Instance rules span every collection, shown and filtered as "*"
    // rather than a title.
    (row) => (row.scope === "instance" ? "*" : row.collectionLabel),
    {
      id: "collection",
      header: () => <ColHeader text="Collection" />,
      meta: { filterPlaceholder: "Filter collection", widthClass: "w-[30%]" },
      cell: (ctx) => (
        <div
          class={cn(
            "text-sm text-on-surface font-medium",
            ctx.row.original.scope === "instance" && "italic"
          )}>
          {ctx.getValue()}
        </div>
      ),
    }
  ),
  columnHelper.accessor("groupLabel", {
    id: "group",
    header: () => <ColHeader text="Group" />,
    meta: { filterPlaceholder: "Filter group", widthClass: "w-[25%]" },
    // The Groups tab consumes ?group=<id> and reveals that group's row.
    cell: (ctx) => (
      <RouterLink
        to={{
          query: { tab: "groups", group: String(ctx.row.original.groupId) },
        }}
        class="text-sm text-primary underline-offset-2 hover:underline">
        {ctx.getValue()}
      </RouterLink>
    ),
  }),
  columnHelper.accessor("permissionLabel", {
    id: "permission",
    header: () => <ColHeader text="Permission" />,
    meta: { filterPlaceholder: "Filter permission", widthClass: "w-[20%]" },
    cell: (ctx) => {
      const dotClass =
        dotClassByLevel[ctx.row.original.permissionLevelNumber] ?? "bg-black";

      return (
        <Chip class="w-32 flex gap-1 items-center border border-outline-variant bg-surface-container text-on-surface">
          <i class={["size-2 shrink-0 rounded-full", dotClass]} />
          <span class="truncate">{ctx.getValue()}</span>
        </Chip>
      );
    },
  }),
  {
    id: "actions",
    header: () => null,
    enableSorting: false,
    meta: { widthClass: "w-24" },
    cell: ({ row }: { row: { original: PermissionRuleRow } }) => (
      <div class="flex justify-end">
        <IconButton
          onClick={() => onEdit(row.original)}
          title="Edit Rule"
          showTooltip={false}>
          <PencilIcon class="size-4" />
        </IconButton>
        <IconButton
          onClick={() => onDelete(row.original)}
          title="Delete Rule"
          showTooltip={false}
          class="enabled:text-error enabled:hover:bg-error-container enabled:hover:text-on-error-container">
          <TrashIcon class="size-4" />
        </IconButton>
      </div>
    ),
  },
];
