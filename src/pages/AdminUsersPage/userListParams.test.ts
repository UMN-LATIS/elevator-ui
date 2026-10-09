import { describe, expect, it } from "vitest";
import type { LocationQuery } from "vue-router";
import { fromUserListQuery, toUserListQuery } from "./userListParams";
import type { AdminUserListParams } from "@/types";

const DEFAULTS: AdminUserListParams = {
  search: "",
  userType: null,
  isSuperAdmin: null,
  page: 1,
  perPage: 25,
};

describe("fromUserListQuery", () => {
  it("reads valid values", () => {
    expect(
      fromUserListQuery({
        search: "smith",
        userType: "Remote",
        isSuperAdmin: "false",
        page: "3",
        perPage: "100",
      })
    ).toEqual({
      search: "smith",
      userType: "Remote",
      isSuperAdmin: false,
      page: 3,
      perPage: 100,
    });
  });

  it("reads Remote-Guest as a user type", () => {
    expect(fromUserListQuery({ userType: "Remote-Guest" }).userType).toBe(
      "Remote-Guest"
    );
  });

  it.each<[string, LocationQuery]>([
    ["no query", {}],
    ["empty filters", { userType: "", isSuperAdmin: "" }],
    ["unknown filter values", { userType: "local", isSuperAdmin: "yes" }],
    ["a zero page", { page: "0" }],
    ["a fractional page", { page: "1.5" }],
    ["a non-numeric page", { page: "abc" }],
    ["a page size the API does not offer", { perPage: "30" }],
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
      perPage: undefined,
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
      perPage: 50,
    };

    expect(fromUserListQuery(toUserListQuery(params) as LocationQuery)).toEqual(
      params
    );
  });
});
