import { createColumnHelper, Row, RowModel } from "@tanstack/vue-table";
import type { Asset, AssetSummary } from "@/types";
import { CircleCheck, Pen, PencilIcon } from "lucide-vue-next";
import { RouterLink } from "vue-router";
import Button from "@/components/Button/Button.vue";
import { TrashIcon } from "lucide-vue-next";
import Tooltip from "@/components/Tooltip/Tooltip.vue";

const columnHelper = createColumnHelper<AssetSummary>();

export const ColHeader = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => <div className={className}>{text}</div>;
export const ColCell = ({ text }: { text: string }) => <div>{text}</div>;

export const columns = [
  columnHelper.accessor("readyForDisplay", {
    header: () => (
      <div class="flex items-center justify-center font-medium">Ready</div>
    ),
    cell: (ctx) => {
      const value = ctx.getValue() as boolean;
      return (
        <div class="flex items-center justify-center">
          <CircleCheck
            class="text-green-500"
            size={16}
            strokeWidth={2}
            style={{ display: value ? "block" : "none" }}
          />
        </div>
      );
    },
  }),
  columnHelper.accessor("objectId", {
    header: () => <ColHeader text="ID" />,
    cell: (ctx) => {
      const objectId = ctx.getValue() as string;
      return (
        <Tooltip tip={objectId} placement="top" hover={true}>
          <RouterLink to={`/assetManager/editAsset/${objectId}`}>
            {/* last 8 chars of objectId */}
            ...{objectId.slice(objectId.length - 8)}
          </RouterLink>
        </Tooltip>
      );
    },
  }),
  columnHelper.accessor("title", {
    header: () => <ColHeader text="Title" />,
    cell: (ctx) => <div>{ctx.getValue()}</div>,
  }),

  columnHelper.accessor("modifiedDate.date", {
    header: () => <ColHeader text="Modified At" />,
    cell: (ctx) => {
      const date = new Date(ctx.getValue() as string);
      return <div>{date.toLocaleString()}</div>;
    },
  }),
  {
    id: "actions",
    header: () => <ColHeader text="Actions" />,
    cell: ({ row }: { row: Row<AssetSummary> }) => {
      return (
        <div class="flex gap-2">
          <RouterLink
            to={`/assetManager/editAsset/${row.original.objectId}`}
            asChild>
            <Button variant="tertiary">
              <PencilIcon class="size-4" />
              <span class="sr-only">Edit</span>
            </Button>
          </RouterLink>
          <Button
            variant="tertiary"
            class="hover:!bg-red-50 !text-red-400 hover:!text-red-500">
            <TrashIcon class="size-4" />
            <span class="sr-only">Delete</span>
          </Button>
        </div>
      );
    },
  },
];
