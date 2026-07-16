import { isManageableGroup } from "@/types";
import type { GroupTypeValues } from "@/types";
import { pluralize } from "@/helpers/pluralize";
import { GROUP_TYPES } from "@/types";

interface SummarizedGroup {
  type: GroupTypeValues;
  entries_count: number;
}

/**
 * What a group holds, as "Users • 3 members".
 *
 * A User group stores its members as entries, so one count serves both
 * and only the noun changes. A global group type reaches its people by
 * rule rather than by listing them, so its type is the whole summary.
 *
 * @param typeLabel the group type's display label, from the type catalog
 *
 * @example
 * ```ts
 * // "Email Domain • 2 entries", under the group's name in a picker
 * toGroupSummary(group, typeDetails.label);
 * ```
 */
export function toGroupSummary(
  group: SummarizedGroup,
  typeLabel: string
): string {
  if (!isManageableGroup(group)) return typeLabel;

  const noun =
    group.type === GROUP_TYPES.USER
      ? pluralize(group.entries_count, "member")
      : pluralize(group.entries_count, "entry", "entries");

  return `${typeLabel} • ${group.entries_count} ${noun}`;
}
