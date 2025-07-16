import * as Type from "@/types";
import { createDefaultWidgetContent } from "@/helpers/createDefaultWidgetContents";

export function makeSetPrimaryContentPayload<
  T extends Type.WithId<Type.WidgetContent>
>(widgetContents: readonly T[], id: string): T[] {
  return widgetContents.map((item) => ({
    ...item,
    isPrimary: item.id === id,
  })) as T[];
}

export function makeAddContentPayload<
  T extends Type.WithId<Type.WidgetContent>
>(widgetContents: readonly T[], widgetDef: Type.WidgetDef): T[] {
  const newItem = createDefaultWidgetContent(widgetDef) as T;
  return [...widgetContents, newItem];
}

export function makeUpdateContentPayload<
  T extends Type.WithId<Type.WidgetContent>
>(
  widgetContents: readonly T[],
  id: string,
  updatedContentItem: any,
  propToUpdate = "fieldContents"
): T[] {
  return widgetContents.map((item) => {
    if (item.id !== id) return item;
    return {
      ...item,
      [propToUpdate]: updatedContentItem,
    };
  }) as T[];
}

export function deleteWidgetContent<T extends Type.WithId<Type.WidgetContent>>(
  widgetContents: readonly T[],
  id: string
): T[] {
  return widgetContents.filter((item) => item.id !== id) as T[];
}
