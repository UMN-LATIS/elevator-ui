import { describe, it, expect } from "vitest";
import { toGroupTypeOptions } from "./toGroupTypeOptions";
import { GROUP_TYPES } from "@/types";
import type { GroupTypeDetails } from "@/types";

const userType: GroupTypeDetails = {
  type: GROUP_TYPES.USER,
  label: "Users",
  description: "Named accounts",
  entryHints: [],
  adminOnly: false,
};

const everyoneType: GroupTypeDetails = {
  type: GROUP_TYPES.ALL,
  label: "Everyone",
  description: "All visitors",
  entryHints: [],
  adminOnly: true,
};

describe("toGroupTypeOptions", () => {
  it("offers an open type as-is, enabled for anyone", () => {
    const options = toGroupTypeOptions([userType], { isAdmin: false });
    expect(options).toEqual([
      {
        id: GROUP_TYPES.USER,
        label: "Users",
        description: "Named accounts",
        disabled: false,
      },
    ]);
  });

  it("keeps an adminOnly type listed but disabled for a non-admin", () => {
    const options = toGroupTypeOptions([everyoneType], { isAdmin: false });
    expect(options[0].label).toBe("Everyone (admin only)");
    expect(options[0].disabled).toBe(true);
  });

  it("enables an adminOnly type for an admin, suffix intact", () => {
    const options = toGroupTypeOptions([everyoneType], { isAdmin: true });
    expect(options[0].label).toBe("Everyone (admin only)");
    expect(options[0].disabled).toBe(false);
  });

  it("keeps the catalog's order", () => {
    const options = toGroupTypeOptions([everyoneType, userType], {
      isAdmin: false,
    });
    expect(options.map((option) => option.id)).toEqual([
      GROUP_TYPES.ALL,
      GROUP_TYPES.USER,
    ]);
  });
});
