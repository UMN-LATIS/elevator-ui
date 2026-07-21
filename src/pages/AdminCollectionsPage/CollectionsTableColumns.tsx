import { createColumnHelper } from "@tanstack/vue-table";
import { RouterLink } from "vue-router";
import { CheckIcon, LockIcon, PencilIcon, TrashIcon } from "lucide-vue-next";
import KebabMenu from "@/components/KebabMenu/KebabMenu.vue";
import { ColHeader } from "../AdminPermissionsPage/ColHeader";
import type { CollectionRow } from "./buildCollectionRows";

const columnHelper = createColumnHelper<CollectionRow>();

export interface CollectionColumnsDeps {
  onEdit: (collection: CollectionRow) => void;
  onDelete: (collection: CollectionRow) => void;
  onPermissions: (collection: CollectionRow) => void;
}

export const createCollectionColumns = (deps: CollectionColumnsDeps) => [
  columnHelper.accessor("title", {
    id: "title",
    header: () => <ColHeader text="Collection" />,
    meta: { widthClass: "w-[45%]" },
    cell: (ctx) => (
      <RouterLink
        to={`/collections/browseCollection/${ctx.row.original.id}`}
        class="text-sm font-medium text-primary underline-offset-2 hover:underline">
        {ctx.getValue()}
      </RouterLink>
    ),
  }),
  columnHelper.accessor("parentTitle", {
    id: "parent",
    header: () => <ColHeader text="Parent" />,
    meta: { widthClass: "w-[30%]" },
    cell: (ctx) => (
      <div class="text-sm text-on-surface-variant">{ctx.getValue()}</div>
    ),
  }),
  columnHelper.accessor("showInBrowse", {
    id: "showInBrowse",
    header: () => <ColHeader text="In Browse" />,
    meta: { widthClass: "w-[15%]" },
    enableGlobalFilter: false,
    cell: (ctx) =>
      ctx.getValue() ? (
        <CheckIcon class="size-4 text-primary" aria-label="Shown in browse" />
      ) : null,
  }),
  {
    id: "actions",
    header: () => null,
    enableSorting: false,
    meta: { widthClass: "w-16" },
    cell: ({ row }: { row: { original: CollectionRow } }) => {
      const collection = row.original;

      return (
        <div class="flex justify-end">
          <KebabMenu
            label={`Actions for ${collection.title}`}
            items={[
              {
                label: "Edit",
                icon: PencilIcon,
                onSelect: () => deps.onEdit(collection),
              },
              {
                label: "Permissions",
                icon: LockIcon,
                onSelect: () => deps.onPermissions(collection),
              },
              {
                label: "Delete",
                icon: TrashIcon,
                variant: "danger",
                onSelect: () => deps.onDelete(collection),
              },
            ]}
          />
        </div>
      );
    },
  },
];
