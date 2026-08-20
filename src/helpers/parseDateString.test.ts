import { describe, it, expect } from "vitest";
import { parseDateString } from "./parseDateString";

describe("parseDateString", () => {
  it("should return unix epoch seconds for valid dates", () => {
    expect(parseDateString("2020-01-01")).toBe("1577836800");
  });

  it("should return negative unix epoch seconds for old dates", () => {
    expect(parseDateString("01/01/500")).toBe("-46388678400");
  });

  it("should return the number of seconds since the Unix Epoch for BC dates", () => {
    expect(parseDateString("1000 BCE")).toBe("-93723993000");
    expect(parseDateString("2 century BCE")).toBe("-68478473000");
  });

  it("should return null for invalid dates", () => {
    expect(parseDateString("Invalid Date")).toBeNull();
  });

  it("should return null for empty dates", () => {
    expect(parseDateString("")).toBeNull();
  });
});
