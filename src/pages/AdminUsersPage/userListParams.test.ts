import { describe, expect, it } from "vitest";
import type { LocationQuery } from "vue-router";
import { fromUserListQuery, toUserListQuery } from "./userListParams";
import type { AdminUserListParams } from "@/types";

const DEFAULTS: AdminUserListParams = {
  search: "",
  userType: null,
  isSuperAdmin: null,
  page: 1,
};

describe("fromUserListQuery", () => {
  it("reads valid values", () => {
    expect(
      fromUserListQuery({
        search: "smith",
        userType: "Remote",
        isSuperAdmin: "false",
        page: "3",
      })
    ).toEqual({
      search: "smith",
      userType: "Remote",
      isSuperAdmin: false,
      page: 3,
    });
  });

  it.each<[string, LocationQuery]>([
    ["no query", {}],
    ["empty filters", { userType: "", isSuperAdmin: "" }],
    ["unknown filter values", { userType: "local", isSuperAdmin: "yes" }],
    ["a zero page", { page: "0" }],
    ["a fractional page", { page: "1.5" }],
    ["a non-numeric page", { page: "abc" }],
    ["repeated keys", { search: ["a", "b"], userType: ["Local", "Remote"] }],
  ])("falls back to defaults for %s", (_case, query) => {
    expect(fromUserListQuery(query)).toEqual(DEFAULTS);
  });
});

describe("toUserListQuery", () => {
  it("leaves out every default, so the first unfiltered page has a bare URL", () => {
    expect(toUserListQuery(DEFAULTS)).toEqual({
      search: undefined,
      userType: undefined,
      isSuperAdmin: undefined,
      page: undefined,
    });
  });

  it("leaves out a whitespace-only search", () => {
    expect(
      toUserListQuery({ ...DEFAULTS, search: "   " }).search
    ).toBeUndefined();
  });

  it("round-trips through fromUserListQuery", () => {
    const params: AdminUserListParams = {
      search: "pat ",
      userType: "Local",
      isSuperAdmin: true,
      page: 2,
    };

    expect(fromUserListQuery(toUserListQuery(params) as LocationQuery)).toEqual(
      params
    );
  });
});
