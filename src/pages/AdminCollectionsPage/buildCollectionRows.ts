import type { AdminCollectionSummary } from "@/types";

// One row of the admin collections table.
export interface CollectionRow {
  id: number;
  title: string;
  // "" for top-level collections
  parentTitle: string;
  showInBrowse: boolean;
  // feeds the delete confirmation, which warns that children move to
  // the top level
  hasChildren: boolean;
}

export function buildCollectionRows(
  collections: AdminCollectionSummary[]
): CollectionRow[] {
  const titleById = new Map(
    collections.map((collection) => [collection.id, collection.title])
  );
  const parentIds = new Set(
    collections.map((collection) => collection.parentId)
  );

  function parentTitleOf(parentId: number | null): string {
    if (parentId === null) return "";
    return titleById.get(parentId) ?? `Collection ${parentId}`;
  }

  return collections.map((collection) => ({
    id: collection.id,
    title: collection.title,
    parentTitle: parentTitleOf(collection.parentId),
    showInBrowse: collection.showInBrowse,
    hasChildren: parentIds.has(collection.id),
  }));
}
