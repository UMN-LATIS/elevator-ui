import { createColumnHelper } from "@tanstack/vue-table";
import type { CSSClass, CustomPageSummary } from "@/types";
import { RouterLink } from "vue-router";
import { CircleCheck, PencilIcon, Trash2 } from "lucide-vue-next";
import IconButton from "@/components/IconButton/IconButton.vue";
import { cn } from "@/lib/utils";

const columnHelper = createColumnHelper<CustomPageSummary>();

const ColHeader = (props: { text: string; class?: CSSClass }) => (
  <div class={cn(["font-medium", props.class])}>{props.text}</div>
);

const BODY_EXCERPT_LENGTH = 100;

const stripHtmlTags = (html: string): string =>
  html.replace(/<[^>]*>/g, "").trim();

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
};

export const createColumns = (onDelete: (pageId: number) => void) => [
  columnHelper.accessor("title", {
    header: () => <ColHeader text="Title" />,
    cell: (ctx) => {
      const id = ctx.row.original.id;
      return (
        <RouterLink to={`/page/view/${id}`} class="text-link hover:underline">
          {ctx.getValue()}
        </RouterLink>
      );
    },
  }),
  columnHelper.accessor("body", {
    header: () => <ColHeader text="Body" />,
    enableSorting: false,
    cell: (ctx) => {
      const body = ctx.getValue() ?? "";
      const plainText = stripHtmlTags(body);
      const excerpt = truncateText(plainText, BODY_EXCERPT_LENGTH);
      return (
        <div class="max-w-md text-sm text-muted-foreground" title={plainText}>
          {excerpt}
        </div>
      );
    },
  }),
  columnHelper.accessor("parentTitle", {
    header: () => <ColHeader text="Parent Page" />,
    cell: (ctx) => {
      const parentTitle = ctx.getValue();
      const parentId = ctx.row.original.parentId;

      if (!parentTitle || !parentId) {
        return <div class="text-muted-foreground">—</div>;
      }

      return (
        <RouterLink
          to={`/page/view/${parentId}`}
          class="text-link hover:underline">
          {parentTitle}
        </RouterLink>
      );
    },
    size: 128,
  }),
  columnHelper.accessor("includeInHeader", {
    header: () => <ColHeader text="Menu" class="w-full text-center" />,
    cell: (ctx) => {
      const value = ctx.getValue();
      return (
        <div class="flex items-center justify-center w-full">
          {value && (
            <CircleCheck class="text-green-500" size={16} strokeWidth={2} />
          )}
        </div>
      );
    },
    maxSize: 64,
    enableSorting: false,
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
    cell: ({ row }: { row: { original: CustomPageSummary } }) => (
      <div class="flex gap-2 items-center justify-center">
        <IconButton
          to={{ name: "editCustomPage", params: { pageId: row.original.id } }}>
          <PencilIcon class="size-4" />
        </IconButton>
        <IconButton
          onClick={() => onDelete(row.original.id)}
          variant="danger-inverse">
          <Trash2 class="size-4" />
        </IconButton>
      </div>
    ),
    maxSize: 64,
  },
];
