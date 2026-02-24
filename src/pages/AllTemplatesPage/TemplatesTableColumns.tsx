import { createColumnHelper } from "@tanstack/vue-table";
import type { CSSClass, TemplateSummary } from "@/types";
import { RouterLink } from "vue-router";
import {
  ArrowUpDownIcon,
  CopyPlusIcon,
  PencilIcon,
  RefreshCcwDotIcon,
  Trash2,
} from "lucide-vue-next";
import IconButton from "@/components/IconButton/IconButton.vue";
import { cn } from "@/lib/utils";
import config from "@/config";

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
        <IconButton
          href={`${config.instance.base.url}/templates/edit/${row.original.id}`}
          showTooltip={false}
          title="Edit">
          <PencilIcon class="size-4" />
        </IconButton>
        <IconButton
          href={`${config.instance.base.url}/templates/sort/${row.original.id}`}
          showTooltip={false}
          title="Reorder Widgets">
          <ArrowUpDownIcon class="size-4" />
        </IconButton>
        <IconButton
          href={`${config.instance.base.url}/templates/copy/${row.original.id}`}
          showTooltip={false}
          title="Duplicate">
          <CopyPlusIcon class="size-4" />
        </IconButton>
        <IconButton
          onClick={() => {
            if (
              !window.confirm(
                "Are you sure you wish to reindex this template and any related templates?"
              )
            ) {
              return;
            }
            window.location.href = `${config.instance.base.url}/templates/forceRecache/${row.original.id}`;
          }}
          showTooltip={false}
          title="Reindex">
          <RefreshCcwDotIcon class="size-4" />
        </IconButton>
        <IconButton
          onClick={() => onDelete(row.original.id)}
          class="enabled:text-error enabled:hover:bg-error-container enabled:hover:text-on-error-container"
          showTooltip={false}
          title="Delete">
          <Trash2 class="size-4" />
        </IconButton>
      </div>
    ),
    maxSize: 128,
  },
];
