import { WIDGET_TYPES, WidgetContent, WidgetProps, WithId } from "@/types";

export function createDefaultWidgetContent(
  widgetProps: WidgetProps
): WithId<WidgetContent> {
  const base = {
    isPrimary: false,
    id: crypto.randomUUID(),
  };

  switch (widgetProps.type) {
    case WIDGET_TYPES.TEXT:
      return {
        ...base,
        fieldContents: "",
      };
    case WIDGET_TYPES.TEXT_AREA:
      return {
        ...base,
        fieldContents: "", // HTML
      };
    case WIDGET_TYPES.CHECKBOX:
      return {
        ...base,
        fieldContents: false,
      };
    case WIDGET_TYPES.DATE:
      return {
        ...base,
        label: "",
        start: { text: null, numeric: null },
        end: { text: null, numeric: null },
      };
    case WIDGET_TYPES.LOCATION:
      return {
        ...base,
        locationLabel: null,
        address: null,
        loc: undefined,
      };
    case WIDGET_TYPES.TAG_LIST:
      return {
        ...base,
        tags: [],
      };
    case WIDGET_TYPES.SELECT:
      return {
        ...base,
        fieldContents: "",
      };
    case WIDGET_TYPES.MULTISELECT:
      return {
        ...base,
        fieldContents: {},
      };
    case WIDGET_TYPES.RELATED_ASSET:
      return {
        ...base,
        targetAssetId: null,
        label: null,
      };
    case WIDGET_TYPES.UPLOAD:
      return {
        ...base,
        fileId: "",
        fileDescription: "",
        fileType: "",
        searchData: null,
        loc: null,
        sidecars: {},
      };
    default:
      const exhaustiveCheck: never = widgetProps.type;
      throw new Error(`Unhandled widget type: ${exhaustiveCheck}`);
  }
}
