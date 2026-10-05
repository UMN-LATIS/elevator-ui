import { describe, expect, it } from "vitest";
import { nextSort, searchRows, sortRows } from "./tableRows";
import type { DataTableColumn } from "@/types";

interface Book {
  title: string;
  shelf: number | null;
}

const books: Book[] = [
  { title: "Volume 10", shelf: 2 },
  { title: "volume 9", shelf: null },
  { title: "Atlas", shelf: 1 },
];

const columns: DataTableColumn<Book>[] = [
  { id: "title", sortValue: (book) => book.title },
  { id: "shelf", sortValue: (book) => book.shelf },
  { id: "actions" },
];

const titlesOf = (rows: Book[]): string[] => rows.map((book) => book.title);

describe("searchRows", () => {
  it("keeps rows where any searchable value contains the text, ignoring case", () => {
    const rows = searchRows(books, "  VOLUME ", (book) => [book.title]);
    expect(titlesOf(rows)).toEqual(["Volume 10", "volume 9"]);
  });

  it("returns every row for blank search text", () => {
    expect(searchRows(books, " ", (book) => [book.title])).toBe(books);
  });
});

describe("sortRows", () => {
  it("orders text naturally, so 9 comes before 10", () => {
    const rows = sortRows(books, columns, {
      columnId: "title",
      direction: "asc",
    });
    expect(titlesOf(rows)).toEqual(["Atlas", "volume 9", "Volume 10"]);
  });

  it("puts rows with no value last in both directions", () => {
    const ascending = sortRows(books, columns, {
      columnId: "shelf",
      direction: "asc",
    });
    const descending = sortRows(books, columns, {
      columnId: "shelf",
      direction: "desc",
    });
    expect(titlesOf(ascending)).toEqual(["Atlas", "Volume 10", "volume 9"]);
    expect(titlesOf(descending)).toEqual(["Volume 10", "Atlas", "volume 9"]);
  });

  it("keeps the given order for no sort or a column without a sort value", () => {
    expect(sortRows(books, columns, null)).toBe(books);
    expect(
      sortRows(books, columns, { columnId: "actions", direction: "asc" })
    ).toBe(books);
  });
});

describe("nextSort", () => {
  it("cycles a column through ascending, descending, and unsorted", () => {
    const ascending = nextSort(null, "title");
    const descending = nextSort(ascending, "title");
    expect(ascending).toEqual({ columnId: "title", direction: "asc" });
    expect(descending).toEqual({ columnId: "title", direction: "desc" });
    expect(nextSort(descending, "title")).toBeNull();
  });

  it("starts a different column ascending", () => {
    const sortedByTitle = { columnId: "title", direction: "desc" } as const;
    expect(nextSort(sortedByTitle, "shelf")).toEqual({
      columnId: "shelf",
      direction: "asc",
    });
  });
});
