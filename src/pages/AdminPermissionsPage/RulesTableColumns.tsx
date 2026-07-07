import { createColumnHelper } from "@tanstack/vue-table";
import { RouterLink } from "vue-router";
import { PencilIcon, TrashIcon } from "lucide-vue-next";
import { cn } from "@/lib/utils";
import IconButton from "@/components/IconButton/IconButton.vue";
import type { PermissionRuleRow } from "./buildRuleRows";
import { ColHeader } from "./ColHeader";

const columnHelper = createColumnHelper<PermissionRuleRow>();

export const createRuleColumns = (
  onEdit: (rule: PermissionRuleRow) => void,
  onDelete: (rule: PermissionRuleRow) => void
) => [
  columnHelper.accessor("collectionLabel", {
    id: "collection",
    header: () => <ColHeader text="Collection" />,
    meta: { filterPlaceholder: "Filter collection", widthClass: "w-[40%]" },
    cell: (ctx) => (
      <div
        class={cn(
          "text-sm text-on-surface font-medium",
          ctx.row.original.scope === "instance" && "italic"
        )}>
        {ctx.getValue()}
      </div>
    ),
  }),
  columnHelper.accessor("groupLabel", {
    id: "group",
    header: () => <ColHeader text="Group" />,
    meta: { filterPlaceholder: "Filter group", widthClass: "w-[30%]" },
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
    cell: (ctx) => (
      <div class="text-sm text-on-surface-variant">{ctx.getValue()}</div>
    ),
  }),
  {
    id: "actions",
    header: () => <ColHeader text="" />,
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
