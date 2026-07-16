import type { SelectOption } from "@/types";
import type { DrawerRuleRow } from "./buildRuleRows";

// Whose group a rule reaches, which decides what the caller can do with
// it, so it is worth a filter of its own.
export type GroupOwnerFilter = "mine" | "others" | "all";

const GROUP_OWNER_FILTERS: GroupOwnerFilter[] = ["mine", "others", "all"];

// The rules for your own groups are the ones you can act on fully, so
// the table opens on them. Everything else is a widening.
export const DEFAULT_GROUP_OWNER: GroupOwnerFilter = "mine";

export interface RuleFilters {
  groupOwner: GroupOwnerFilter;
  // empty means every drawer, not none
  drawerIds: number[];
  groupIds: number[];
}

export function toGroupOwnerFilter(value: unknown): GroupOwnerFilter {
  return (
    GROUP_OWNER_FILTERS.find((filter) => filter === value) ??
    DEFAULT_GROUP_OWNER
  );
}

/**
 * Read an id list out of a query param, as in "5,8".
 *
 * A hand-edited or stale link can carry anything, and a filter nobody
 * can see is worse than no filter, so unreadable ids drop out instead of
 * emptying the table.
 */
export function parseIdList(value: unknown): number[] {
  if (typeof value !== "string" || value === "") return [];

  const ids = value.split(",").map((part) => Number(part.trim()));
  return ids.filter((id) => Number.isInteger(id) && id > 0);
}

// Undefined keeps an empty filter out of the URL entirely.
export function toIdParam(ids: number[]): string | undefined {
  return ids.length > 0 ? ids.join(",") : undefined;
}

function matchesGroupOwner(
  rule: DrawerRuleRow,
  groupOwner: GroupOwnerFilter
): boolean {
  if (groupOwner === "all") return true;
  return rule.isOwnGroup === (groupOwner === "mine");
}

/**
 * The distinct picks a column's filter can offer, sorted by label.
 *
 * Rules repeat a drawer once per group it reaches, and a group once per
 * drawer, so both lists dedupe.
 */
export function toFilterOptions(
  rows: DrawerRuleRow[],
  toOption: (rule: DrawerRuleRow) => SelectOption<number>
): SelectOption<number>[] {
  const optionById = new Map<number, SelectOption<number>>();
  for (const rule of rows) {
    const option = toOption(rule);
    optionById.set(option.id, option);
  }

  return [...optionById.values()].sort((left, right) =>
    left.label.localeCompare(right.label)
  );
}

export function filterRuleRows(
  rows: DrawerRuleRow[],
  { groupOwner, drawerIds, groupIds }: RuleFilters
): DrawerRuleRow[] {
  return rows.filter((rule) => {
    if (!matchesGroupOwner(rule, groupOwner)) return false;
    if (drawerIds.length > 0 && !drawerIds.includes(rule.drawerId))
      return false;
    if (groupIds.length > 0 && !groupIds.includes(rule.groupId)) return false;
    return true;
  });
}
