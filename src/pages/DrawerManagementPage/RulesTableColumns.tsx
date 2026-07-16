import type { ColumnDef } from "@tanstack/vue-table";
import { createColumnHelper } from "@tanstack/vue-table";
import { PencilIcon, TrashIcon } from "lucide-vue-next";
import IconButton from "@/components/IconButton/IconButton.vue";
import { ColHeader } from "../AdminPermissionsPage/ColHeader";
import type { DrawerRuleRow } from "./buildRuleRows";
import { toDrawerTitle } from "./toDrawerTitle";

const columnHelper = createColumnHelper<DrawerRuleRow>();

export const createRuleColumns = (
  onEdit: (rule: DrawerRuleRow) => void,
  onDelete: (rule: DrawerRuleRow) => void
): ColumnDef<DrawerRuleRow, string>[] => [
  columnHelper.accessor((row) => toDrawerTitle(row.drawer), {
    id: "drawer",
    header: () => <ColHeader text="Drawer" />,
    meta: { widthClass: "w-[40%]" },
    cell: (ctx) => (
      <div class="text-sm font-medium text-on-surface">{ctx.getValue()}</div>
    ),
  }),
  columnHelper.accessor((row) => row.group.label || row.group.type, {
    id: "group",
    header: () => <ColHeader text="Group" />,
    meta: { widthClass: "w-[30%]" },
    cell: (ctx) => <div class="text-sm text-on-surface">{ctx.getValue()}</div>,
  }),
  columnHelper.accessor((row) => row.permission.label, {
    id: "permission",
    header: () => <ColHeader text="Permission" />,
    meta: { widthClass: "w-[30%]" },
    cell: (ctx) => <div class="text-sm text-on-surface">{ctx.getValue()}</div>,
  }),
  {
    id: "actions",
    header: () => null,
    enableSorting: false,
    meta: { widthClass: "w-20" },
    cell: ({ row }: { row: { original: DrawerRuleRow } }) => (
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
