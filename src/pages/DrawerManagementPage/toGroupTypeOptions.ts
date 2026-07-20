import type { GroupTypeDetails, SelectOption } from "@/types";

/**
 * The group types a picker offers, in catalog order.
 *
 * An adminOnly type stays listed but disabled for everyone else, so the
 * types read as a fixed set rather than one that changes per viewer. The
 * API rejects them server-side regardless.
 */
export function toGroupTypeOptions(
  groupTypes: GroupTypeDetails[],
  { isAdmin }: { isAdmin: boolean }
): SelectOption[] {
  return groupTypes.map((groupType) => ({
    id: groupType.type,
    label: groupType.adminOnly
      ? `${groupType.label} (admin only)`
      : groupType.label,
    description: groupType.description,
    disabled: groupType.adminOnly && !isAdmin,
  }));
}
