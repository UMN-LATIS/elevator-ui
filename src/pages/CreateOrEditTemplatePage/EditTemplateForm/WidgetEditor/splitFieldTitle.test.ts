import { describe, it, expect } from "vitest";
import { splitFieldTitle } from "./splitFieldTitle";

describe("splitFieldTitle", () => {
  it.each([
    ["title_7", "title", "_7"],
    ["date_location_7", "date_location", "_7"],
    ["phase_2_7", "phase_2", "_7"],
    ["title_123", "title", "_123"],
    ["_7", "", "_7"],
    ["foo", "foo", ""],
    ["foo_", "foo_", ""],
    ["foo7", "foo7", ""],
    ["", "", ""],
  ])("splits %j into %j and %j", (fieldTitle, name, instanceSuffix) => {
    expect(splitFieldTitle(fieldTitle)).toEqual({ name, instanceSuffix });
  });
});
