import { describe, it, expect } from "vitest";
import { buildPermissionOptions } from "./buildPermissionOptions";
import { PERM } from "@/types";
import type { PermissionLevel } from "@/types";

const levels: PermissionLevel[] = [
  { id: 1, level: PERM.NOPERM, name: "noperm", label: "No Permissions" },
  { id: 2, level: PERM.SEARCH, name: "search", label: "Search" },
  { id: 3, level: PERM.ADMIN, name: "admin", label: "Admin" },
];

function optionLabels(options: { label: string }[]): string[] {
  return options.map((option) => option.label);
}

describe("buildPermissionOptions", () => {
  it("omits No Permissions by default", () => {
    expect(optionLabels(buildPermissionOptions(levels))).toEqual([
      "Search",
      "Admin",
    ]);
  });

  it("offers No Permissions when asked, for revoking a rule in place", () => {
    const options = buildPermissionOptions(levels, {
      includesNoPermissions: true,
    });
    expect(optionLabels(options)).toEqual([
      "No Permissions",
      "Search",
      "Admin",
    ]);
  });

  it("carries the level through, which drives the dot color", () => {
    const [search] = buildPermissionOptions([levels[1]]);
    expect(search).toEqual({ id: 2, label: "Search", level: PERM.SEARCH });
  });
});
