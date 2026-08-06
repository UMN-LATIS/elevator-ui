import { describe, it, expect } from "vitest";
import { phpDateToString } from "./phpDateToString";

// runs under the timezone project, east of UTC. The unit project pins TZ to
// UTC, where reading a UTC date through the local clock cannot go wrong.
describe("phpDateToString away from UTC", () => {
  it("reports the stored calendar day", () => {
    expect(
      phpDateToString({
        date: "2026-08-01 00:00:00.000000",
        timezone_type: 3,
        timezone: "UTC",
      })
    ).toBe("2026-08-01");
  });

  it("reports the stored day for a time late in the day", () => {
    expect(
      phpDateToString({
        date: "2026-08-01 23:30:00.000000",
        timezone_type: 3,
        timezone: "UTC",
      })
    ).toBe("2026-08-01");
  });

  it("has no date to report", () => {
    expect(phpDateToString(null)).toBe("");
  });
});
