import { describe, it, expect } from "vitest";
import {
  permissionDotClass,
  permissionChipClass,
} from "./permissionLevelColors";
import { PERM } from "@/types";

describe("permissionDotClass", () => {
  it("colors a read tier green and the admin tier red", () => {
    expect(permissionDotClass(PERM.SEARCH)).toBe("bg-green-500");
    expect(permissionDotClass(PERM.ADMIN)).toBe("bg-red-500");
  });

  it("grays out the no-permissions tier", () => {
    expect(permissionDotClass(PERM.NOPERM)).toBe("bg-gray-500");
  });

  it("falls back to black for a level the map does not name", () => {
    expect(permissionDotClass(999)).toBe("bg-black");
  });
});

describe("permissionChipClass", () => {
  it("borders and washes the chip in the dot's hue", () => {
    expect(permissionChipClass(PERM.SEARCH)).toBe(
      "border-green-500 bg-green-500/10"
    );
  });

  it("falls back to black for a level the map does not name", () => {
    expect(permissionChipClass(999)).toBe("border-black bg-black/10");
  });
});
