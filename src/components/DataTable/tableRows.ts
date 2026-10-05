import type {
  DataTableColumn,
  SearchableValue,
  SortValue,
  TableSort,
} from "@/types";

const naturalOrder = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

export function searchRows<TRow>(
  rows: TRow[],
  searchText: string,
  searchableValuesOf: (row: TRow) => SearchableValue[]
): TRow[] {
  const query = searchText.trim().toLowerCase();
  if (!query) return rows;

  return rows.filter((row) =>
    searchableValuesOf(row).some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(query)
    )
  );
}

function isMissing(value: SortValue): value is null | undefined {
  return value === null || value === undefined;
}

function compareAscending(left: SortValue, right: SortValue): number {
  if (typeof left === "string" || typeof right === "string") {
    return naturalOrder.compare(String(left), String(right));
  }
  return Number(left) - Number(right);
}

export function sortRows<TRow>(
  rows: TRow[],
  columns: DataTableColumn<TRow>[],
  sort: TableSort | null
): TRow[] {
  if (!sort) return rows;
  const sortValue = columns.find(
    (column) => column.id === sort.columnId
  )?.sortValue;
  if (!sortValue) return rows;

  const directionSign = sort.direction === "asc" ? 1 : -1;

  return [...rows].sort((leftRow, rightRow) => {
    const left = sortValue(leftRow);
    const right = sortValue(rightRow);
    if (isMissing(left) && isMissing(right)) return 0;
    if (isMissing(left)) return 1;
    if (isMissing(right)) return -1;
    return compareAscending(left, right) * directionSign;
  });
}

export function nextSort(
  sort: TableSort | null,
  columnId: string
): TableSort | null {
  if (sort?.columnId !== columnId) return { columnId, direction: "asc" };
  if (sort.direction === "asc") return { columnId, direction: "desc" };
  return null;
}

export function defaultSortOf<TRow>(
  columns: DataTableColumn<TRow>[]
): TableSort | null {
  const column = columns.find((candidate) => candidate.defaultSort);
  if (!column?.defaultSort) return null;
  return { columnId: column.id, direction: column.defaultSort };
}
