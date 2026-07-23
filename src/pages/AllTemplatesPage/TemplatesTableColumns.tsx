import { createColumnHelper } from "@tanstack/vue-table";
import type { CSSClass, TemplateSummary } from "@/types";
import {
  CopyPlusIcon,
  PencilIcon,
  RefreshCcwDotIcon,
  Trash2,
} from "lucide-vue-next";
import KebabMenu from "@/components/KebabMenu/KebabMenu.vue";
import { cn } from "@/lib/utils";

const columnHelper = createColumnHelper<TemplateSummary>();

const ColHeader = (props: { text: string; class?: CSSClass }) => (
  <div class={cn(["font-medium", props.class])}>{props.text}</div>
);

export interface TemplateColumnsDeps {
  onEdit: (template: TemplateSummary) => void;
  onDuplicate: (template: TemplateSummary) => void;
  onReindex: (template: TemplateSummary) => void;
  onDelete: (template: TemplateSummary) => void;
}

export const createColumns = (deps: TemplateColumnsDeps) => [
  columnHelper.accessor("id", {
    header: () => <ColHeader text="ID" />,
    cell: (ctx) => (
      <div class="text-sm text-muted-foreground">{ctx.getValue()}</div>
    ),
    meta: { widthClass: "w-16" },
  }),
  // No widthClass: table-fixed gives this column all the leftover width.
  columnHelper.accessor("name", {
    header: () => <ColHeader text="Name" />,
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
    meta: { widthClass: "w-28" },
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
    meta: { widthClass: "w-28" },
  }),
  {
    id: "actions",
    header: () => <ColHeader text="Actions" class="sr-only" />,
    enableSorting: false,
    cell: ({ row }: { row: { original: TemplateSummary } }) => (
      <div class="flex items-center justify-end">
        <KebabMenu
          label={`Actions for ${row.original.name}`}
          items={[
            {
              label: "Edit",
              icon: PencilIcon,
              onSelect: () => deps.onEdit(row.original),
            },
            {
              label: "Duplicate",
              icon: CopyPlusIcon,
              onSelect: () => deps.onDuplicate(row.original),
            },
            {
              label: "Reindex",
              icon: RefreshCcwDotIcon,
              onSelect: () => deps.onReindex(row.original),
            },
            {
              label: "Delete",
              icon: Trash2,
              variant: "danger",
              onSelect: () => deps.onDelete(row.original),
            },
          ]}
        />
      </div>
    ),
    meta: { widthClass: "w-16" },
  },
];
