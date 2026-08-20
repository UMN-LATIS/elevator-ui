import * as Type from "@/types";
import { createDefaultWidgetContent } from "@/helpers/createDefaultWidgetContents";
import { parseDateString } from "@/helpers/parseDateString";

/**
 * Re-reads `numeric` from `text` for both `start` and `end`, so that a date
 * range is always two numbers this app produced from the text on screen.
 *
 * Re-parsing only the edited side would leave the other numeric as whatever
 * wrote it, which for a stored range can be an older parse of the same day.
 * A range can then read as start after end without either date changing.
 */
export function dateContentWithNumericsFromText<
  T extends Type.DateWidgetContent
>(content: T): T {
  return {
    ...content,
    start: {
      ...content.start,
      numeric: parseDateString(content.start.text ?? ""),
    },
    end: { ...content.end, numeric: parseDateString(content.end.text ?? "") },
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
  updatedContentItem: unknown,
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

  // the backend reads isPrimary to pick the asset's representative content
  // (Asset_model.php), so hand the role on rather than leaving none
  const shouldPromoteNewPrimary =
    removedItem?.isPrimary &&
    remainingContents.length > 0 &&
    !remainingContents.some((item) => item.isPrimary);
  if (!shouldPromoteNewPrimary) return remainingContents;

  return remainingContents.map((item, index) =>
    index === 0 ? { ...item, isPrimary: true } : item
  );
}
