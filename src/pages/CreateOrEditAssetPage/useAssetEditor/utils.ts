import {
  Asset,
  Template,
  UnsavedAsset,
  WidgetContent,
  WidgetDef,
  PHPDateTime,
  WithId,
} from "@/types";
import invariant from "tiny-invariant";
import { hasWidgetContent } from "@/helpers/hasWidgetContent";
import { createDefaultWidgetContent } from "@/helpers/createDefaultWidgetContents";
import { equals, omit } from "ramda";
import { explainObjectDifferences } from "@/helpers/explainObjectDifferences";

export function omitWidgetIds(asset: Asset | UnsavedAsset, template: Template) {
  // remove ids from each widget content item
  const widgetContentsWithoutIds = template.widgetArray.reduce(
    (acc, widgetDef) => {
      const widgetContents = asset[widgetDef.fieldTitle] as
        | WithId<WidgetContent>[]
        | undefined;
      if (!widgetContents) {
        return acc;
      }
      acc[widgetDef.fieldTitle] = widgetContents.map((c) => omit(["id"], c));
      return acc;
    },
    {} as Record<string, WidgetContent[]>
  );

  return {
    ...asset,
    ...widgetContentsWithoutIds,
  };
}

export function hasAssetChanged(
  {
    savedAsset,
    localAsset,
    template,
  }: {
    savedAsset: Asset | null;
    localAsset: Asset | UnsavedAsset;
    template: Template;
  },
  { logDifferences = false }: { logDifferences?: boolean } = {}
): boolean {
  if (!savedAsset || !localAsset || !template) return true;

  // For create mode, always consider as changed if there's any content
  if (!savedAsset.assetId) return true;

  const savedAssetWithoutIds = omitWidgetIds(savedAsset, template);
  const localAssetWithoutIds = omitWidgetIds(localAsset, template);

  // Check if any saved content differs from local content
  const someSavedContentDiffers = Object.entries(savedAssetWithoutIds).some(
    ([key, savedValue]) => {
      const localValue = localAssetWithoutIds[key];
      return !equals(savedValue, localValue);
    }
  );

  // Check if local asset has new fields with content not in saved asset
  const hasNewLocalPropWithContent = Object.entries(localAssetWithoutIds)
    .filter(([key]) => !(key in savedAssetWithoutIds))
    .some(([, localValue]) =>
      hasWidgetContent(localValue as WidgetContent[], "any")
    );

  const hasChanged = someSavedContentDiffers || hasNewLocalPropWithContent;

  if (logDifferences && hasChanged) {
    const msg = explainObjectDifferences(
      savedAssetWithoutIds,
      localAssetWithoutIds
    );
    console.log("Asset differences:", msg);
  }

  return hasChanged;
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

export function getMissingRequiredFields({
  asset,
  template,
}: {
  asset: Asset | UnsavedAsset;
  template: Template;
}) {
  return template.widgetArray
    .filter((widgetDef) => widgetDef.required)
    .filter((widgetDef) => {
      const fieldTitle = widgetDef.fieldTitle;
      const widgetContents = asset[fieldTitle] as WidgetContent[];
      return !hasWidgetContent(widgetContents, widgetDef.type);
    })
    .map((widgetDef) => widgetDef.label);
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

export function migrateAssetToTemplate(
  asset: Asset | UnsavedAsset,
  newTemplate: Template
): Asset | UnsavedAsset {
  // Create a new local asset with the new template
  const localAsset = makeLocalAsset({
    template: newTemplate,
    collectionId: asset.collectionId,
    savedAsset: null,
  });

  // Copy over the fields from the old asset to the new one
  return {
    ...localAsset,
    ...asset,
    templateId: newTemplate.templateId, // Ensure the templateId is updated
  };
}

export function phpDateToString(phpDateTime: PHPDateTime | null): string {
  if (!phpDateTime?.date) {
    return "";
  }
  return new Date(phpDateTime.date).toISOString().split("T")[0];
}
