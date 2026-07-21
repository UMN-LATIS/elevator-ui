import type { AdminCollectionSummary } from "@/types";

/**
 * Ids of every collection nested under `rootId`, however deep.
 *
 * The parent select disables these (and the root itself) because the
 * API rejects a parent that would create a cycle.
 */
export function collectDescendantIds(
  collections: AdminCollectionSummary[],
  rootId: number
): Set<number> {
  const childIdsByParentId = new Map<number, number[]>();
  for (const collection of collections) {
    if (collection.parentId === null) continue;
    const siblingIds = childIdsByParentId.get(collection.parentId) ?? [];
    siblingIds.push(collection.id);
    childIdsByParentId.set(collection.parentId, siblingIds);
  }

  const descendantIds = new Set<number>();
  const idsToVisit = [rootId];
  while (idsToVisit.length > 0) {
    const currentId = idsToVisit.pop() as number;
    for (const childId of childIdsByParentId.get(currentId) ?? []) {
      // guard against a pre-existing cycle in the data
      if (descendantIds.has(childId)) continue;
      descendantIds.add(childId);
      idsToVisit.push(childId);
    }
  }
  return descendantIds;
}
