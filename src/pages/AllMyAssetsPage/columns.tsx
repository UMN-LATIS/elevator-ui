import { h } from "vue";
import { ColumnDef } from "@tanstack/vue-table";
import type { Asset } from "@/types";

export const columns: ColumnDef<Asset>[] = [
  // {
  //   accessorKey: "amount",
  //   header: () => h("div", { class: "text-right" }, "Amount"),
  //   cell: ({ row }) => {
  //     const amount = Number.parseFloat(row.getValue("amount"));
  //     const formatted = new Intl.NumberFormat("en-US", {
  //       style: "currency",
  //       currency: "USD",
  //     }).format(amount);

  //     return h("div", { class: "text-right font-medium" }, formatted);
  //   },
  // },
  {
    accessorKey: "objectId",
    // header: () => h("div", { class: "text-right" }, "ID"),
    header: () => <div>ID</div>,
    cell: ({ row }) => (
      <div class="font-medium">{row.getValue("objectId")}</div>
    ),
  },
];
