import * as Type from "@/types";
import { omit } from "ramda";
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
  // these widgets still key their contents on `id`, which the shared helper
  // no longer sets, and they must not carry the `uuid` it now adds, because
  // this editor's save sends contents as they sit in state. The editor
  // being built alongside them keys on `uuid`
  const newItem: Type.WithId<Type.WidgetContent> = {
    ...omit(["uuid"], createDefaultWidgetContent(widgetDef)),
    id: crypto.randomUUID(),
  };
  return [...widgetContents, newItem as T];
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
