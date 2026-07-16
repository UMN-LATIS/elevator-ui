import { describe, it, expect } from "vitest";
import { toGroupSummary } from "./toGroupSummary";
import { GROUP_TYPES } from "@/types";
import type { GroupTypeValues } from "@/types";

// The backend's AuthHelper types arrive as arbitrary strings that
// GroupTypeValues does not name, which is why isAuthHelperGroupType
// recognizes them by exclusion.
const EMAIL_DOMAIN = "EmailDomain" as GroupTypeValues;

describe("toGroupSummary", () => {
  it("counts a User group's entries as its members", () => {
    const group = { type: GROUP_TYPES.USER, entries_count: 3 };
    expect(toGroupSummary(group, "Users")).toBe("Users • 3 members");
  });

  it("counts any other manageable group's entries as entries", () => {
    const group = { type: EMAIL_DOMAIN, entries_count: 2 };
    expect(toGroupSummary(group, "Email Domain")).toBe(
      "Email Domain • 2 entries"
    );
  });

  it("says entry, not entries, for a group holding one", () => {
    const group = { type: EMAIL_DOMAIN, entries_count: 1 };
    expect(toGroupSummary(group, "Email Domain")).toBe(
      "Email Domain • 1 entry"
    );
  });

  it("counts an empty group as zero rather than hiding the count", () => {
    const group = { type: GROUP_TYPES.USER, entries_count: 0 };
    expect(toGroupSummary(group, "Users")).toBe("Users • 0 members");
  });

  it("leaves a global group type to its label, which lists nobody", () => {
    const group = { type: GROUP_TYPES.ALL, entries_count: 0 };
    expect(toGroupSummary(group, "Everyone")).toBe("Everyone");
  });
});
