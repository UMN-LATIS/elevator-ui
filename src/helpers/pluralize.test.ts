import { describe, it, expect } from "vitest";
import { pluralize } from "./pluralize";

describe("pluralize", () => {
  it("should return the singular form of a word if the count is 1", () => {
    expect(pluralize(1, "item")).toBe("item");
  });

  it("should return the plural form of a word if the count is not 1", () => {
    expect(pluralize(2, "item")).toBe("items");
  });

  it("should pluralize with a custom plural form when provided", () => {
    expect(pluralize(1, "mouse", "mice")).toBe("mouse");
    expect(pluralize(2, "mouse", "mice")).toBe("mice");
  });
});
