import { createColumnHelper, Row } from "@tanstack/vue-table";
import type { DeletedAssetSummary } from "@/types";
import { ColHeader } from "./UserAssetsTableColumns";
import Button from "@/components/Button/Button.vue";
import { RotateCcw } from "lucide-vue-next";

const columnHelper = createColumnHelper<DeletedAssetSummary>();

export const createDeletedColumns = (handlers: {
  onRestore: (objectId: string) => void;
}) => [
  columnHelper.accessor("objectId", {
    header: () => <ColHeader text="ID" />,
    cell: (ctx) => {
      const objectId = ctx.getValue() as string;
      return <div>&hellip;{objectId.slice(objectId.length - 8)}</div>;
    },
  }),
  columnHelper.accessor("title", {
    header: () => <ColHeader text="Title" />,
    cell: (ctx) => <div>{ctx.getValue()}</div>,
  }),
  columnHelper.accessor("deletedAt", {
    header: () => <ColHeader text="Deleted At" />,
    cell: (ctx) => {
      const date = new Date(ctx.getValue() as string);
      return <div>{date.toLocaleString()}</div>;
    },
  }),
  {
    id: "actions",
    header: () => <ColHeader text="Actions" />,
    cell: ({ row }: { row: Row<DeletedAssetSummary> }) => (
      <Button
        variant="tertiary"
        onClick={() => handlers.onRestore(row.original.objectId as string)}>
        <RotateCcw class="size-4" />
        Restore
      </Button>
    ),
  },
];
