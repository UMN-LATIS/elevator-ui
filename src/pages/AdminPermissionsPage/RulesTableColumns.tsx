import { createColumnHelper } from "@tanstack/vue-table";
import type { CSSClass } from "@/types";
import { cn } from "@/lib/utils";
import type { PermissionRuleRow } from "./buildRuleRows";

const columnHelper = createColumnHelper<PermissionRuleRow>();

const ColHeader = (props: { text: string; class?: CSSClass }) => (
  <div
    class={cn(["font-medium uppercase text-xs tracking-wider", props.class])}>
    {props.text}
  </div>
);

export const ruleColumns = [
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
];
