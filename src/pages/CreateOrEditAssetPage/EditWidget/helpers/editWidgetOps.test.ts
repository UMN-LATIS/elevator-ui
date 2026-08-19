import { describe, it, expect } from "vitest";
import {
  deleteWidgetContent,
  dateContentWithNumericsFromText,
} from "./editWidgetOps";
import { parseDateString } from "@/helpers/parseDateString";
import type { DateWidgetContent, WidgetContent, WithUuid } from "@/types";

const makeRows = (
  ...rows: { uuid: string; isPrimary?: boolean }[]
): WithUuid<WidgetContent>[] =>
  rows.map((row) => ({ isPrimary: false, ...row }));

describe("dateContentWithNumericsFromText", () => {
  const makeDateRow = (
    start: { text: string | null; numeric: string | null },
    end: { text: string | null; numeric: string | null }
  ): WithUuid<DateWidgetContent> => ({
    uuid: "row-1",
    isPrimary: false,
    label: null,
    start,
    end,
  });

  it("re-parses the endpoint the user did not touch", () => {
    // the untouched endpoint's numeric was created by an older parse. Leaving
    // it alone lets one row hold two epoch bases, which reads as start after
    // end for the same civil day.
    const row = makeDateRow(
      { text: "March 5, 2020", numeric: "stale-start" },
      { text: "March 5, 2020", numeric: "stale-end" }
    );

    const updated = dateContentWithNumericsFromText(row);

    expect(updated.start.numeric).toBe(parseDateString("March 5, 2020"));
    expect(updated.end.numeric).toBe(parseDateString("March 5, 2020"));
    expect(updated.start.numeric).toBe(updated.end.numeric);
  });

  it("leaves empty text with no numeric", () => {
    const row = makeDateRow(
      { text: "2020", numeric: "stale" },
      { text: "", numeric: "stale" }
    );

    const updated = dateContentWithNumericsFromText(row);

    expect(updated.start.numeric).toBe(parseDateString("2020"));
    expect(updated.end.numeric).toBeNull();
  });

  it("keeps every other field on the row", () => {
    const row = {
      ...makeDateRow(
        { text: "2020", numeric: null },
        { text: null, numeric: null }
      ),
      label: "Published",
    };

    const updated = dateContentWithNumericsFromText(row);

    expect(updated).toMatchObject({
      uuid: "row-1",
      label: "Published",
      isPrimary: false,
    });
  });
});

describe("deleteWidgetContent", () => {
  it("promotes the first remaining row when the primary is deleted", () => {
    const rows = makeRows(
      { uuid: "a", isPrimary: true },
      { uuid: "b" },
      { uuid: "c" }
    );

    expect(deleteWidgetContent(rows, "a")).toEqual(
      makeRows({ uuid: "b", isPrimary: true }, { uuid: "c" })
    );
  });

  it("leaves the primary alone when another row is deleted", () => {
    const rows = makeRows({ uuid: "a" }, { uuid: "b", isPrimary: true });

    expect(deleteWidgetContent(rows, "a")).toEqual(
      makeRows({ uuid: "b", isPrimary: true })
    );
  });

  it("deletes the last row without inventing a primary", () => {
    const rows = makeRows({ uuid: "a", isPrimary: true });

    expect(deleteWidgetContent(rows, "a")).toEqual([]);
  });
});
