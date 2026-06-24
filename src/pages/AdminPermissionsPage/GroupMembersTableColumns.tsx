import { createColumnHelper } from "@tanstack/vue-table";
import { XIcon } from "lucide-vue-next";
import type { CSSClass, GroupMember } from "@/types";
import { cn } from "@/lib/utils";
import IconButton from "@/components/IconButton/IconButton.vue";

const columnHelper = createColumnHelper<GroupMember>();

const ColHeader = (props: { text: string; class?: CSSClass }) => (
  <div class={cn(["font-medium", props.class])}>{props.text}</div>
);

export const createGroupMemberColumns = (
  onRemove: (member: GroupMember) => void
) => [
  columnHelper.accessor("name", {
    header: () => <ColHeader text="Name" />,
    cell: (ctx) => <div class="text-sm">{ctx.getValue()}</div>,
  }),
  columnHelper.accessor("email", {
    header: () => <ColHeader text="Email" />,
    cell: (ctx) => (
      <div class="text-sm text-muted-foreground">{ctx.getValue() || "—"}</div>
    ),
  }),
  columnHelper.accessor("username", {
    header: () => <ColHeader text="Username" />,
    cell: (ctx) => (
      <div class="text-sm text-muted-foreground">{ctx.getValue() || "—"}</div>
    ),
  }),
  columnHelper.accessor("userType", {
    header: () => <ColHeader text="Type" />,
    cell: (ctx) => (
      <div class="text-sm text-muted-foreground">{ctx.getValue()}</div>
    ),
  }),
  columnHelper.accessor("createdAt", {
    header: () => <ColHeader text="Created" />,
    cell: (ctx) => {
      const value = ctx.getValue();
      return (
        <div class="text-sm text-muted-foreground">
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
          title="Remove member"
          showTooltip={false}
          class="enabled:text-error enabled:hover:bg-error-container enabled:hover:text-on-error-container">
          <XIcon class="size-4" />
        </IconButton>
      </div>
    ),
    maxSize: 64,
  },
];
