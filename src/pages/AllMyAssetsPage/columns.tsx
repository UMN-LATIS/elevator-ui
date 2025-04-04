import { createColumnHelper } from "@tanstack/vue-table";
import type { AssetSummary } from "@/types";
import { CircleCheck } from "lucide-vue-next";
import { RouterLink } from "vue-router";

const columnHelper = createColumnHelper<AssetSummary>();

export const ColHeader = ({ text }: { text: string }) => (
  <div class="font-medium">{text}</div>
);
export const ColCell = ({ text }: { text: string }) => <div>{text}</div>;

export const columns = [
  columnHelper.accessor("readyForDisplay", {
    header: () => <ColHeader text="Ready" />,
    cell: (ctx) => {
      const value = ctx.getValue() as boolean;
      return (
        <CircleCheck
          class="text-green-500"
          size={20}
          strokeWidth={3}
          style={{ display: value ? "block" : "none" }}
        />
      );
    },
  }),
  columnHelper.accessor("objectId", {
    header: () => <ColHeader text="ID" />,
    cell: (ctx) => {
      const objectId = ctx.getValue() as string;
      return (
        <RouterLink to={`/assetManager/editAsset/${objectId}`}>
          {objectId}
        </RouterLink>
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
];
