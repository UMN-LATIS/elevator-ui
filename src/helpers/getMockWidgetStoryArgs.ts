import {
  getWidgetContents,
  getWidgetPropsByFieldTitle,
} from "@/helpers/displayUtils";
import type { Template, Asset, WidgetDef, WidgetContent } from "@/types";

export function getMockWidgetStoryArgs<
  T extends WidgetDef = WidgetDef,
  U extends WidgetContent = WidgetContent
>({
  fieldTitle,
  template,
  asset,
}: {
  fieldTitle: string;
  template: Template;
  asset: Asset;
}): { widget: T; contents: U[] | null; asset: Asset } {
  const widget = getWidgetPropsByFieldTitle<T>(template, fieldTitle);

  if (!widget) throw new Error("cannot find widget");

  const contents = getWidgetContents<T, U>({ asset, widget });

  return {
    asset,
    widget,
    contents,
  };
}
