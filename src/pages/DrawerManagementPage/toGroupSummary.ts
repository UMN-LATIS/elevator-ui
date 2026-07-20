import { isManageableGroup } from "@/types";
import type { GroupTypeValues } from "@/types";
import { pluralize } from "@/helpers/pluralize";
import { GROUP_TYPES } from "@/types";

interface SummarizedGroup {
  type: GroupTypeValues;
  entries_count: number;
}

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
