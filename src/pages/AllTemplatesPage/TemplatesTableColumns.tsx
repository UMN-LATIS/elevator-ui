import { createColumnHelper } from "@tanstack/vue-table";
import type { CSSClass, TemplateSummary } from "@/types";
import { RouterLink } from "vue-router";
import { PencilIcon, Trash2 } from "lucide-vue-next";
import IconButton from "@/components/IconButton/IconButton.vue";
import { cn } from "@/lib/utils";

const columnHelper = createColumnHelper<TemplateSummary>();

const ColHeader = (props: { text: string; class?: CSSClass }) => (
  <div class={cn(["font-medium", props.class])}>{props.text}</div>
);

export const createColumns = (onDelete: (pageId: number) => void) => [
  columnHelper.accessor("id", {
    header: () => <ColHeader text="ID" />,
    cell: (ctx) => (
      <div class="text-sm text-muted-foreground">{ctx.getValue()}</div>
    ),
    maxSize: 64,
  }),
  columnHelper.accessor("name", {
    header: () => <ColHeader text="Name" />,
    cell: (ctx) => {
      const id = ctx.row.original.id;
      return <div class="text-sm text-muted-foreground">{ctx.getValue()}</div>;
    },
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
    maxSize: 96,
  }),
  columnHelper.accessor("modifiedAt", {
    header: () => <ColHeader text="Modified" />,
    cell: (ctx) => {
      const value = ctx.getValue();
      return (
        <div class="text-sm text-muted-foreground">
          {value ? new Date(value).toLocaleDateString() : "—"}
        </div>
      );
    },
    maxSize: 96,
  }),
  {
    id: "actions",
    header: () => <ColHeader text="Actions" class=" w-full text-center" />,
    enableSorting: false,
    cell: ({ row }: { row: { original: TemplateSummary } }) => (
      <div class="flex gap-2 items-center justify-center">
        {/* <IconButton
          to={{ name: "editTemplate", params: { pageId: row.original.id } }}
          showTooltip={false}
          title="Edit">
          <PencilIcon class="size-4" />
        </IconButton> */}
        {/* <IconButton
          onClick={() => onDelete(row.original.id)}
          class="enabled:text-error enabled:hover:bg-error-container enabled:hover:text-on-error-container"
          showTooltip={false}
          title="Delete">
          <Trash2 class="size-4" />
        </IconButton> */}
      </div>
    ),
    maxSize: 64,
  },
];
