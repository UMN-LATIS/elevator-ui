import * as T from "@/types";

/**
 * Every collection as a select option, sorted by title, with collections the
 * user cannot edit shown but disabled.
 */
export function toCollectionOptions(
  collections: Omit<T.AssetCollection, "children">[]
): T.SelectOption<number>[] {
  return collections
    .map((collection) => ({
      label: collection.title,
      id: collection.id,
      disabled: !collection.canEdit,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function toTemplateOptions(
  templates: T.ElevatorInstance["templates"]
): T.SelectOption<number>[] {
  return templates.map((template) => ({
    label: template.name,
    id: template.id,
  }));
}
