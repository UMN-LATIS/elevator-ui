import { describe, it, expect } from "vitest";
import { makeEmptyPageFormState, toPageFormState } from "./toPageFormState";
import type { CustomPageSummary } from "@/types";

const storedPage: CustomPageSummary = {
  id: 3,
  title: "About",
  includeInHeader: true,
  parentId: 1,
  parentTitle: "Home",
  body: "<p>hello</p>",
};

describe("toPageFormState", () => {
  it("renames parentId to the parent field the form holds", () => {
    expect(toPageFormState(storedPage)).toEqual({
      title: "About",
      parent: 1,
      includeInHeader: true,
    });
  });

  it("keeps a top-level page's null parent", () => {
    expect(
      toPageFormState({ ...storedPage, parentId: null }).parent
    ).toBeNull();
  });

  it("leaves the body out, since the body editor owns it", () => {
    expect(toPageFormState(storedPage)).not.toHaveProperty("body");
  });

  // An untouched create form has to match this exactly, or a page an admin
  // never typed into would read as having unsaved changes.
  it("matches an empty form when the stored page is empty", () => {
    const emptyPage = {
      ...storedPage,
      title: "",
      parentId: null,
      includeInHeader: false,
    };

    expect(toPageFormState(emptyPage)).toEqual(makeEmptyPageFormState());
  });
});
