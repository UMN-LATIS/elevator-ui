import { describe, it, expect } from "vitest";
import { toDrawerTitle } from "./toDrawerTitle";

describe("toDrawerTitle", () => {
  it("uses the drawer's own title when it has one", () => {
    expect(toDrawerTitle({ id: 7, title: "Field Photos" })).toBe(
      "Field Photos"
    );
  });

  it("labels an untitled drawer by its id", () => {
    expect(toDrawerTitle({ id: 7, title: null })).toBe("Drawer 7");
  });

  it("treats an empty title as untitled", () => {
    expect(toDrawerTitle({ id: 7, title: "" })).toBe("Drawer 7");
  });
});
