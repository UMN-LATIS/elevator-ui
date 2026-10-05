import type { RowData } from "@tanstack/vue-table";

declare module "@tanstack/vue-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    // Tailwind width class applied to the column's header cells. The
    // tables use table-fixed layout so widths hold steady while
    // filtering adds and removes rows.
    widthClass?: string;
  }
}

// Uppercase header cell shared by the permissions tables.
export const ColHeader = (props: { text: string }) => (
  <div class="font-medium uppercase text-xs tracking-wider">{props.text}</div>
);
