export type ColumnWidth = "xs" | "sm" | "md" | "lg";

export type SortDirection = "asc" | "desc";

export type SortValue = string | number | boolean | null | undefined;

export type SearchableValue = string | number | null | undefined;

export interface DataTableColumn<TRow> {
  id: string;
  label?: string;
  isLabelHidden?: boolean;
  isHidden?: boolean;
  align?: "center";
  width?: ColumnWidth;
  sortValue?: (row: TRow) => SortValue;
  searchValue?: (row: TRow) => SearchableValue | SearchableValue[];
  defaultSort?: SortDirection;
}

export interface ItemName {
  singular: string;
  plural: string;
}

export interface TableSort {
  columnId: string;
  direction: SortDirection;
}

/** `page` starts at 1. */
export interface TablePagination {
  page: number;
  perPage: number;
  total: number;
}

export interface DataTableHandle {
  reveal: (
    rowId: string | number,
    options?: { expand?: boolean }
  ) => Promise<HTMLElement | null>;
}
