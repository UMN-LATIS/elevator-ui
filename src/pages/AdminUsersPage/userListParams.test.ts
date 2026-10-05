import { describe, expect, it } from "vitest";
import type { LocationQuery } from "vue-router";
import { parseUserListParams, toUserListQuery } from "./userListParams";
import type { AdminUserListParams } from "@/types";

const DEFAULTS: AdminUserListParams = {
  search: "",
  userType: null,
  isSuperAdmin: null,
  page: 1,
};

describe("parseUserListParams", () => {
  it("reads valid values", () => {
    expect(
      parseUserListParams({
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
    expect(parseUserListParams(query)).toEqual(DEFAULTS);
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

  it("round-trips through parseUserListParams", () => {
    const params: AdminUserListParams = {
      search: "pat ",
      userType: "Local",
      isSuperAdmin: true,
      page: 2,
    };

    expect(
      parseUserListParams(toUserListQuery(params) as LocationQuery)
    ).toEqual(params);
  });
});
