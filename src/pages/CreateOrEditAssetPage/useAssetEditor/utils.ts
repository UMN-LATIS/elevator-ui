import {
  Asset,
  BaseAsset,
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
import { equals, omit, pick } from "ramda";
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

// The BaseAsset fields `toSaveableFormData` sends. Widget fields are added from
// the template at the call site. An allowlist means a field the server adds
// later cannot read as an unsaved edit, the way a denylist of known server
// fields would let it.
const EDITABLE_BASE_ASSET_FIELDS = [
  "templateId",
  "collectionId",
  "readyForDisplay",
  "availableAfter",
] as const satisfies readonly (keyof BaseAsset)[];

/**
 * JSON has no undefined, so the server can never send such a key, and a
 * working copy that carries one never matches the saved copy again. Widget
 * defaults and cleared flags both leave them behind.
 */
function withoutUndefinedValues(
  value: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined)
  );
}

/**
 * Reduces an asset to the parts an admin can edit, so that two assets can be
 * compared for unsaved changes.
 *
 * Keeps the template's widget fields and the few asset-level fields the save
 * request carries, drops the ids the server assigns to widget content items,
 * and drops any key holding undefined. Comparing server-owned fields would
 * report an asset as edited immediately after it was saved.
 */
export function toComparableAsset(
  asset: Asset | UnsavedAsset,
  template: Template
): Record<string, unknown> {
  const withoutIds = omitWidgetIds(asset, template);

  const widgetContentsWithoutUndefinedValues = template.widgetArray.reduce(
    (acc, widgetDef) => {
      const contents = withoutIds[widgetDef.fieldTitle] as
        | Record<string, unknown>[]
        | undefined;
      if (!contents) return acc;

      acc[widgetDef.fieldTitle] = contents.map(withoutUndefinedValues);
      return acc;
    },
    {} as Record<string, unknown>
  );

  const comparableFields = [
    ...EDITABLE_BASE_ASSET_FIELDS,
    ...template.widgetArray.map((widgetDef) => widgetDef.fieldTitle),
  ];

  return withoutUndefinedValues(
    pick(comparableFields, {
      ...withoutIds,
      ...widgetContentsWithoutUndefinedValues,
    })
  );
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
  // A new asset has nothing on the server to compare against, so it is
  // measured against the untouched asset its template would have produced.
  // Calling it changed outright would let an empty create form block leaving.
  const baselineAsset = savedAsset?.assetId
    ? savedAsset
    : makeLocalAsset({
        template,
        collectionId: localAsset.collectionId,
        savedAsset: null,
      });

  const comparableBaselineAsset = toComparableAsset(baselineAsset, template);
  const comparableLocalAsset = toComparableAsset(localAsset, template);

  const someBaselineContentDiffers = Object.entries(
    comparableBaselineAsset
  ).some(([key, baselineValue]) => {
    const localValue = comparableLocalAsset[key];
    return !equals(baselineValue, localValue);
  });

  // a key the baseline lacks counts only once it holds real content
  const hasNewLocalPropWithContent = Object.entries(comparableLocalAsset)
    .filter(([key]) => !(key in comparableBaselineAsset))
    .some(([, localValue]) =>
      hasWidgetContent(localValue as WidgetContent[], "any")
    );

  const hasChanged = someBaselineContentDiffers || hasNewLocalPropWithContent;

  if (logDifferences && hasChanged) {
    const msg = explainObjectDifferences(
      comparableBaselineAsset,
      comparableLocalAsset
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
    modified: null,
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
