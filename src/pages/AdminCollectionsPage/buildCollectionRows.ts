import type { CollectionAdminSummary } from "@/types";

// One row of the admin collections table.
export interface CollectionRow {
  id: number;
  title: string;
  parentId: number | null;
  // "" for top-level collections
  parentTitle: string;
  showInBrowse: boolean;
  // feeds the delete confirmation, which warns that children move to
  // the top level
  hasChildren: boolean;
}

export function buildCollectionRows(
  collections: CollectionAdminSummary[]
): CollectionRow[] {
  const titleById = new Map(
    collections.map((collection) => [collection.id, collection.title])
  );
  const parentIds = new Set(
    collections.map((collection) => collection.parentId)
  );

  return collections.map((collection) => ({
    id: collection.id,
    title: collection.title,
    parentId: collection.parentId,
    parentTitle:
      collection.parentId === null
        ? ""
        : titleById.get(collection.parentId) ??
          `Collection ${collection.parentId}`,
    showInBrowse: collection.showInBrowse,
    hasChildren: parentIds.has(collection.id),
  }));
}
