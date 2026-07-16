import { describe, it, expect } from "vitest";
import {
  filterRuleRows,
  parseIdList,
  toFilterOptions,
  toGroupOwnerFilter,
  toIdParam,
} from "./ruleFilters";
import type { RuleFilters } from "./ruleFilters";
import type { DrawerRuleRow } from "./buildRuleRows";
import { PERM } from "@/types";

function makeRule(overrides: Partial<DrawerRuleRow> = {}): DrawerRuleRow {
  return {
    id: 1,
    drawerId: 10,
    drawerTitle: "Field Notes",
    groupId: 100,
    groupLabel: "Botany Students",
    isOwnGroup: true,
    ownerName: "Ada Lovelace",
    permissionLevelId: 2,
    permissionLevelNumber: PERM.SEARCH,
    permissionLabel: "Search",
    ...overrides,
  };
}

const noFilters: RuleFilters = {
  groupOwner: "all",
  drawerIds: [],
  groupIds: [],
};

describe("toGroupOwnerFilter", () => {
  it("reads the filters it knows", () => {
    expect(toGroupOwnerFilter("others")).toBe("others");
    expect(toGroupOwnerFilter("all")).toBe("all");
  });

  it("falls back to the caller's own groups for anything else", () => {
    expect(toGroupOwnerFilter(undefined)).toBe("mine");
    expect(toGroupOwnerFilter("nonsense")).toBe("mine");
    expect(toGroupOwnerFilter(["others"])).toBe("mine");
  });
});

describe("parseIdList", () => {
  it("reads a comma separated list", () => {
    expect(parseIdList("5,8")).toEqual([5, 8]);
  });

  it("tolerates spacing", () => {
    expect(parseIdList("5, 8")).toEqual([5, 8]);
  });

  it("is empty for a missing or blank param", () => {
    expect(parseIdList(undefined)).toEqual([]);
    expect(parseIdList("")).toEqual([]);
    // a repeated param arrives as an array
    expect(parseIdList(["5"])).toEqual([]);
  });

  it("drops ids it cannot read rather than emptying the table", () => {
    expect(parseIdList("5,banana,8")).toEqual([5, 8]);
    expect(parseIdList("0,-3,1.5,9")).toEqual([9]);
  });
});

describe("toIdParam", () => {
  it("joins ids for the URL", () => {
    expect(toIdParam([5, 8])).toBe("5,8");
  });

  it("keeps an empty filter out of the URL", () => {
    expect(toIdParam([])).toBeUndefined();
  });
});

describe("toFilterOptions", () => {
  const rows = [
    makeRule({ id: 1, drawerId: 10, drawerTitle: "Zebra" }),
    makeRule({ id: 2, drawerId: 20, drawerTitle: "Anteater" }),
    // the same drawer reached by a second group
    makeRule({ id: 3, drawerId: 10, drawerTitle: "Zebra", groupId: 200 }),
  ];

  it("offers each drawer once, sorted by label", () => {
    const options = toFilterOptions(rows, (rule) => ({
      id: rule.drawerId,
      label: rule.drawerTitle,
    }));
    expect(options).toEqual([
      { id: 20, label: "Anteater" },
      { id: 10, label: "Zebra" },
    ]);
  });

  it("is empty without rules", () => {
    expect(toFilterOptions([], (rule) => ({ id: rule.id, label: "" }))).toEqual(
      []
    );
  });
});

describe("filterRuleRows", () => {
  const ownRule = makeRule({ id: 1, isOwnGroup: true });
  const othersRule = makeRule({
    id: 2,
    isOwnGroup: false,
    groupId: 200,
    drawerId: 20,
  });
  const rows = [ownRule, othersRule];

  it("keeps every rule when nothing is filtered", () => {
    expect(filterRuleRows(rows, noFilters)).toEqual(rows);
  });

  it("narrows to the caller's own groups", () => {
    expect(filterRuleRows(rows, { ...noFilters, groupOwner: "mine" })).toEqual([
      ownRule,
    ]);
  });

  it("narrows to other owners' groups", () => {
    expect(
      filterRuleRows(rows, { ...noFilters, groupOwner: "others" })
    ).toEqual([othersRule]);
  });

  it("narrows to the picked drawers", () => {
    expect(filterRuleRows(rows, { ...noFilters, drawerIds: [20] })).toEqual([
      othersRule,
    ]);
  });

  it("narrows to the picked groups", () => {
    expect(filterRuleRows(rows, { ...noFilters, groupIds: [100] })).toEqual([
      ownRule,
    ]);
  });

  it("requires every filter to agree", () => {
    const conflicting: RuleFilters = {
      groupOwner: "mine",
      drawerIds: [20],
      groupIds: [],
    };
    expect(filterRuleRows(rows, conflicting)).toEqual([]);
  });
});
