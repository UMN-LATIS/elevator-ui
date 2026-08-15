import * as Type from "@/types";
import { createDefaultWidgetContent } from "@/helpers/createDefaultWidgetContents";
import { parseDateString } from "@/helpers/parseDateString";

/**
 * Both endpoints re-parsed from their own text.
 *
 * Editing one endpoint alone would leave the other's numeric as whatever an
 * older parse produced, and parseDateString has not always resolved text to
 * the same epoch basis. Two bases in one row compare as start after end for
 * a single civil day, so every edit re-parses the pair together.
 */
export function dateRowWithNumericsFromText<T extends Type.DateWidgetContent>(
  row: T
): T {
  return {
    ...row,
    start: { ...row.start, numeric: parseDateString(row.start.text ?? "") },
    end: { ...row.end, numeric: parseDateString(row.end.text ?? "") },
  };
}

export function makeSetPrimaryContentPayload<
  T extends Type.WithUuid<Type.WidgetContent>
>(widgetContents: readonly T[], uuid: string): T[] {
  return widgetContents.map((item) => ({
    ...item,
    isPrimary: item.uuid === uuid,
  })) as T[];
}

export function makeAddContentPayload<
  T extends Type.WithUuid<Type.WidgetContent>
>(widgetContents: readonly T[], widgetDef: Type.WidgetDef): T[] {
  const newItem = createDefaultWidgetContent(widgetDef) as T;
  return [...widgetContents, newItem];
}

export function makeUpdateContentPayload<
  T extends Type.WithUuid<Type.WidgetContent>
>(
  widgetContents: readonly T[],
  uuid: string,
  updatedContentItem: any,
  propToUpdate = "fieldContents"
): T[] {
  return widgetContents.map((item) => {
    if (item.uuid !== uuid) return item;
    return {
      ...item,
      [propToUpdate]: updatedContentItem,
    };
  }) as T[];
}

export function deleteWidgetContent<
  T extends Type.WithUuid<Type.WidgetContent>
>(widgetContents: readonly T[], uuid: string): T[] {
  const removedItem = widgetContents.find((item) => item.uuid === uuid);
  const remainingContents = widgetContents.filter(
    (item) => item.uuid !== uuid
  ) as T[];

  // deleting the primary row promotes the first remaining one, so previews
  // and titles built on isPrimary never point at nothing
  const shouldPromoteNewPrimary =
    removedItem?.isPrimary &&
    remainingContents.length > 0 &&
    !remainingContents.some((item) => item.isPrimary);
  if (!shouldPromoteNewPrimary) return remainingContents;

  return remainingContents.map((item, index) =>
    index === 0 ? { ...item, isPrimary: true } : item
  );
}
