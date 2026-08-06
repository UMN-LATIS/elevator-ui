import { describe, it, expect } from "vitest";
import { parseDateString } from "./parseDateString";

// vitest pins TZ to UTC, where the local clock and UTC coincide. The cases
// here pin the intended UTC-basis values so a regression to bare
// Date.parse (which splits formats between UTC and local) still has its
// contract written down.
describe("parseDateString", () => {
  it("resolves every date-only format to the same utc midnight", () => {
    const expected = (Date.UTC(2020, 0, 15) / 1000).toString();

    expect(parseDateString("2020-01-15")).toBe(expected);
    expect(parseDateString("1/15/2020")).toBe(expected);
    expect(parseDateString("January 15, 2020")).toBe(expected);
  });

  it("keeps an explicit zone and a bare year as absolute times", () => {
    expect(parseDateString("2020-01-15T06:00:00Z")).toBe(
      (Date.UTC(2020, 0, 15, 6) / 1000).toString()
    );
    expect(parseDateString("2020")).toBe(
      (Date.UTC(2020, 0, 1) / 1000).toString()
    );
  });

  it("keeps a year under 100 out of the 1900s", () => {
    // Date.UTC reads a two-digit year as 19xx, and this app stores ancient
    // dates, so the rebuild has to say which century it means
    const year90 = new Date(0);
    year90.setUTCFullYear(90, 0, 5);

    expect(parseDateString("0090-01-05T00:00:00")).toBe(
      (year90.getTime() / 1000).toString()
    );
    // the plain ISO form already parsed correctly and must stay that way
    expect(parseDateString("0090-01-05")).toBe(
      (year90.getTime() / 1000).toString()
    );
  });

  it("reads an ancient date written with slashes", () => {
    expect(parseDateString("01/01/500")).toBe("-46388678400");
  });

  it("handles bc dates and centuries", () => {
    expect(parseDateString("500 BC")).toBe(
      (-1 * 500 * 31556900 - 1970 * 31556900).toString()
    );
    expect(parseDateString("5th century BC")).toBe(
      (-1 * 500 * 31556900 - 1970 * 31556900).toString()
    );
  });

  it("spells bc as bce and counts a century either way", () => {
    // literal epochs, so a change to the year-length constant or to the
    // arithmetic around it has to be stated here rather than followed
    expect(parseDateString("1000 BCE")).toBe("-93723993000");
    expect(parseDateString("2 century BCE")).toBe("-68478473000");
  });

  it("returns null for text that is not a date", () => {
    expect(parseDateString("")).toBeNull();
    expect(parseDateString("not a date")).toBeNull();
  });
});
