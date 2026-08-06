import { describe, it, expect } from "vitest";
import { deleteWidgetContent } from "./editWidgetOps";
import type { WidgetContent, WithId } from "@/types";

const makeRows = (
  ...rows: { id: string; isPrimary?: boolean }[]
): WithId<WidgetContent>[] =>
  rows.map((row) => ({ isPrimary: false, ...row }));

describe("deleteWidgetContent", () => {
  it("promotes the first remaining row when the primary is deleted", () => {
    const rows = makeRows(
      { id: "a", isPrimary: true },
      { id: "b" },
      { id: "c" }
    );

    expect(deleteWidgetContent(rows, "a")).toEqual(
      makeRows({ id: "b", isPrimary: true }, { id: "c" })
    );
  });

  it("leaves the primary alone when another row is deleted", () => {
    const rows = makeRows({ id: "a" }, { id: "b", isPrimary: true });

    expect(deleteWidgetContent(rows, "a")).toEqual(
      makeRows({ id: "b", isPrimary: true })
    );
  });

  it("deletes the last row without inventing a primary", () => {
    const rows = makeRows({ id: "a", isPrimary: true });

    expect(deleteWidgetContent(rows, "a")).toEqual([]);
  });
});
