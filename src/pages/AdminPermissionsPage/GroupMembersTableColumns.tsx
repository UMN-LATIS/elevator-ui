import { createColumnHelper } from "@tanstack/vue-table";
import { TrashIcon } from "lucide-vue-next";
import type { CSSClass, GroupMember } from "@/types";
import { cn } from "@/lib/utils";
import IconButton from "@/components/IconButton/IconButton.vue";

const columnHelper = createColumnHelper<GroupMember>();

const ColHeader = (props: { text: string; class?: CSSClass }) => (
  <div class={cn(["font-medium uppercase text-xs tracking-wider", props.class])}>
    {props.text}
  </div>
);

export const createGroupMemberColumns = (
  onRemove: (member: GroupMember) => void
) => [
  columnHelper.accessor("name", {
    header: () => <ColHeader text="Name" />,
    cell: (ctx) => (
      <div class="text-sm text-on-surface font-medium">{ctx.getValue()}</div>
    ),
  }),
  columnHelper.accessor("email", {
    header: () => <ColHeader text="Email" />,
    cell: (ctx) => (
      <div class="text-sm text-on-surface-variant">{ctx.getValue() || "—"}</div>
    ),
  }),
  columnHelper.accessor("username", {
    header: () => <ColHeader text="Username" />,
    cell: (ctx) => (
      <div class="text-sm text-on-surface-variant">{ctx.getValue() || "—"}</div>
    ),
  }),
  columnHelper.accessor("userType", {
    header: () => <ColHeader text="Type" />,
    cell: (ctx) => (
      <div class="text-sm text-on-surface-variant">{ctx.getValue()}</div>
    ),
  }),
  columnHelper.accessor("createdAt", {
    header: () => <ColHeader text="Created" />,
    cell: (ctx) => {
      const value = ctx.getValue();
      return (
        <div class="text-sm text-on-surface-variant">
          {value ? new Date(value).toLocaleDateString() : "—"}
        </div>
      );
    },
  }),
  {
    id: "actions",
    header: () => <ColHeader text="" />,
    enableSorting: false,
    cell: ({ row }: { row: { original: GroupMember } }) => (
      <div class="flex justify-end">
        <IconButton
          onClick={() => onRemove(row.original)}
          title="Remove"
          showTooltip={false}
          class="enabled:hover:bg-error-container enabled:hover:text-on-error-container">
            { /* XIcon is used by Cancel, TrashIcon is used by Remove */ }
          <TrashIcon class="size-4" />
        </IconButton>
      </div>
    ),
    maxSize: 64,
  },
];
