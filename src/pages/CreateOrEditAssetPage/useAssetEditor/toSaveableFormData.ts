import {
  Asset,
  Template,
  UnsavedAsset,
  WidgetContent,
  PHPDateTime,
  UpdateAssetRequestFormData,
} from "@/types";
import { saveableWidgetContents } from "./toStoredShape";

/**
 * The wire form of a save. The server rebuilds the whole document from
 * this, so every widget field the template defines must be present, and an
 * empty array (not an omitted key) is how contents are deleted.
 */
export function toSaveableFormData(
  asset: Asset | UnsavedAsset,
  template: Template
): UpdateAssetRequestFormData {
  const widgetFields: Record<string, WidgetContent[]> = {};
  for (const widgetDef of template.widgetArray) {
    const widgetContents = asset[widgetDef.fieldTitle] as
      | WidgetContent[]
      | undefined;
    if (!Array.isArray(widgetContents)) continue;
    widgetFields[widgetDef.fieldTitle] = saveableWidgetContents(
      widgetContents,
      widgetDef.type
    );
  }

  return {
    objectId: asset.assetId ?? "",
    templateId: String(asset.templateId),
    newTemplateId: String(asset.templateId),
    collectionId: String(asset.collectionId),
    newCollectionId: String(asset.collectionId),
    readyForDisplay: asset.readyForDisplay as boolean,
    // sent verbatim, not date-truncated: legacy values can carry a time of
    // day the editor must not strip
    availableAfter: (asset.availableAfter as PHPDateTime)?.date,
    ...widgetFields,
  };
}
