import { createColumnHelper } from "@tanstack/vue-table";
import { PencilIcon, TrashIcon } from "lucide-vue-next";
import type { CSSClass } from "@/types";
import { cn } from "@/lib/utils";
import IconButton from "@/components/IconButton/IconButton.vue";
import type { PermissionRuleRow } from "./buildRuleRows";

const columnHelper = createColumnHelper<PermissionRuleRow>();

const ColHeader = (props: { text: string; class?: CSSClass }) => (
  <div
    class={cn(["font-medium uppercase text-xs tracking-wider", props.class])}>
    {props.text}
  </div>
);

export const createRuleColumns = (
  onEdit: (rule: PermissionRuleRow) => void,
  onDelete: (rule: PermissionRuleRow) => void
) => [
  columnHelper.accessor("collectionLabel", {
    id: "collection",
    header: () => <ColHeader text="Collection" />,
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
    cell: (ctx) => (
      <div class="text-sm text-on-surface-variant">{ctx.getValue()}</div>
    ),
  }),
  columnHelper.accessor("permissionLabel", {
    id: "permission",
    header: () => <ColHeader text="Permission" />,
    cell: (ctx) => (
      <div class="text-sm text-on-surface-variant">{ctx.getValue()}</div>
    ),
  }),
  {
    id: "actions",
    header: () => <ColHeader text="" />,
    enableSorting: false,
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
          class="enabled:hover:bg-error-container enabled:hover:text-on-error-container">
          <TrashIcon class="size-4" />
        </IconButton>
      </div>
    ),
    maxSize: 96,
  },
];
