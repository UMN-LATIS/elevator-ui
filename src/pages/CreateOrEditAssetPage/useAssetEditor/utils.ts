import {
  Asset,
  Template,
  UnsavedAsset,
  WidgetContent,
  WidgetDef,
  PHPDateTime,
  UpdateAssetRequestFormData,
} from "@/types";
import invariant from "tiny-invariant";
import microdiff, { type Difference } from "microdiff";
import { hasWidgetContent } from "@/helpers/hasWidgetContent";
import { createDefaultWidgetContent } from "@/helpers/createDefaultWidgetContents";

export function getWidgetContentsWithoutIds(
  asset: Asset | UnsavedAsset,
  template: Template
): Record<string, WidgetContent[]> {
  return template.widgetArray.reduce((acc, widgetDef) => {
    const widgetContents = asset[widgetDef.fieldTitle] as
      | WidgetContent[]
      | undefined;
    if (!widgetContents) {
      return acc;
    }
    // omit id from each widget content
    acc[widgetDef.fieldTitle] = widgetContents.map(
      ({ id: _id, ...rest }) => rest
    );
    return acc;
  }, {} as Record<string, WidgetContent[]>);
}

export function omitWidgetIds(asset: Asset | UnsavedAsset, template: Template) {
  const widgetContentsWithoutIds = getWidgetContentsWithoutIds(asset, template);
  return {
    ...asset,
    ...widgetContentsWithoutIds,
  };
}

export function diffAssets(
  asset1: Asset | UnsavedAsset | null,
  asset2: Asset | UnsavedAsset | null,
  template: Template,
  opts = { ignoreWidgetIds: true }
): Difference[] {
  if (!asset1 || !asset2) {
    return [] as Difference[];
  }
  if (!opts.ignoreWidgetIds) {
    return microdiff(asset1, asset2);
  }

  invariant(template, "Template is required for assetDiff");

  const asset1WithoutIds = omitWidgetIds(asset1, template);
  const asset2WithoutIds = omitWidgetIds(asset2, template);

  return microdiff(asset1WithoutIds, asset2WithoutIds);
}

export function makeLocalAsset({
  template,
  collectionId,
  savedAsset = null,
}: {
  template: Template;
  collectionId: number;
  savedAsset: Asset | null;
}): Asset | UnsavedAsset {
  return savedAsset
    ? makeLocalAssetFromSaved({ template, collectionId, savedAsset })
    : makeNewLocalAsset({ template, collectionId });
}

export function makeLocalAssetFromSaved({
  template,
  collectionId,
  savedAsset,
}: {
  template: Template;
  collectionId: number;
  savedAsset: Asset;
}): Asset {
  invariant(template, "Template is required to initialize local asset");
  const localAsset = { ...savedAsset };
  localAsset.templateId = template.templateId;
  localAsset.collectionId = collectionId;

  // loop through widgets, add widget contents if missing
  template.widgetArray.forEach((widgetDef) => {
    const fieldTitle = widgetDef.fieldTitle;
    const currentContents = localAsset[fieldTitle] as
      | WidgetContent[]
      | undefined;

    localAsset[fieldTitle] = makeWidgetContents(widgetDef, currentContents);
  });

  return localAsset;
}

function makeNewLocalAsset({
  template,
  collectionId,
}: {
  template: Template;
  collectionId: number;
}): UnsavedAsset {
  // create the asset
  const initialAsset: UnsavedAsset = {
    assetId: null,
    templateId: template.templateId,
    readyForDisplay: true,
    collectionId,
    availableAfter: null,
    modified: {
      date: new Date().toISOString(),
      timezone_type: 3,
      timezone: "UTC",
    },
    modifiedBy: 0,
    createdBy: 0,
    deletedBy: null,
    relatedAssetCache: null,
    firstFileHandlerId: null,
    firstObjectId: null,
    titleObject: null,
    title: [""],
  };

  // add fields for each widget in the template
  template.widgetArray.forEach((widgetDef) => {
    initialAsset[widgetDef.fieldTitle] = makeWidgetContents(widgetDef);
  });

  return initialAsset;
}

export function makeWidgetContents(
  widgetDef: WidgetDef,
  currentContents?: WidgetContent[]
): WidgetContent[] {
  if (currentContents && currentContents.length > 0) {
    return currentContents.map((content) => {
      // ensure each content has an id
      return {
        ...content,
        id: content.id ?? crypto.randomUUID(),
      };
    });
  }
  // if no current contents, create default contents based on widget type
  return widgetDef.type === "upload"
    ? [] // uploads should be empty until a file is added
    : [createDefaultWidgetContent(widgetDef)];
}

export function doAllRequiredHaveContent(
  asset: Asset | UnsavedAsset,
  template: Template
): boolean {
  const requiredWidgetDefs = template.widgetArray.filter(
    (widgetDef) => widgetDef.required
  );

  return requiredWidgetDefs.every((widgetDef) => {
    invariant(asset);
    const fieldTitle = widgetDef.fieldTitle;
    const contents = asset[fieldTitle] as WidgetContent[];
    return hasWidgetContent(contents, widgetDef.type);
  });
}

export function toSaveableFormData(
  asset: Asset | UnsavedAsset,
  template: Template
): UpdateAssetRequestFormData {
  const widgetContentsWithoutIds = getWidgetContentsWithoutIds(asset, template);

  return {
    objectId: asset.assetId ?? "",
    templateId: String(asset.templateId),
    newTemplateId: String(asset.templateId),
    collectionId: String(asset.collectionId),
    newCollectionId: String(asset.collectionId),
    readyForDisplay: asset.readyForDisplay as boolean,
    availableAfter: (asset.availableAfter as PHPDateTime)?.date,
    ...widgetContentsWithoutIds,
  };
}
