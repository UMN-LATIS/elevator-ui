import {
  Asset,
  Template,
  UnsavedAsset,
  UploadWidgetContent,
  WidgetContent,
  WidgetDef,
  WIDGET_TYPES,
  PHPDateTime,
  WithId,
} from "@/types";
import invariant from "tiny-invariant";
import { createDefaultWidgetContent } from "@/helpers/createDefaultWidgetContents";
import { equals, omit } from "ramda";

/**
 * Asset properties the user can change outside the template's widgets.
 * `templateId` is here because migrating an asset to another template is an
 * edit like any other.
 */
const EDITABLE_ASSET_PROPERTIES = [
  "collectionId",
  "availableAfter",
  "readyForDisplay",
  "templateId",
];

function editableAssetKeys(template: Template): string[] {
  const widgetKeys = template.widgetArray.map(
    (widgetDef) => widgetDef.fieldTitle
  );
  return [...EDITABLE_ASSET_PROPERTIES, ...widgetKeys];
}

/**
 * Widget content ids are generated on the client and never round-trip, so
 * two contents holding the same values are the same content.
 */
function fieldValueWithoutContentIds(value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  return value.map((item) =>
    item && typeof item === "object" ? omit(["id"], item) : item
  );
}

function isFieldUnchanged(draftValue: unknown, savedValue: unknown): boolean {
  return equals(
    fieldValueWithoutContentIds(draftValue),
    fieldValueWithoutContentIds(savedValue)
  );
}

/**
 * The editable fields where `draft` differs from `savedAsset`, which is the
 * set of changes a save still needs to send.
 */
export function diffEditableFields({
  draft,
  savedAsset,
  template,
}: {
  draft: Asset | UnsavedAsset;
  savedAsset: Asset;
  template: Template;
}): Partial<Asset> {
  const edits: Partial<Asset> = {};
  editableAssetKeys(template).forEach((assetKey) => {
    if (isFieldUnchanged(draft[assetKey], savedAsset[assetKey])) return;
    edits[assetKey] = draft[assetKey];
  });
  return edits;
}

/**
 * Record one field edit. Setting a field back to its saved value drops it,
 * so an edit and its undo leave nothing pending.
 */
export function editsWithFieldEdit({
  edits,
  savedAsset,
  assetKey,
  value,
}: {
  edits: Partial<Asset>;
  savedAsset: Asset;
  assetKey: string;
  value: unknown;
}): Partial<Asset> {
  if (isFieldUnchanged(value, savedAsset[assetKey])) {
    return omit([assetKey], edits);
  }
  return { ...edits, [assetKey]: value };
}

/**
 * The flag asks the next save to rebuild derivatives, so once that save has
 * happened it has served its purpose. It is client-only and never comes back
 * from the server, so leaving it set would read as an unsaved change forever.
 */
export function clearUploadRegenerationFlags<T extends Asset | UnsavedAsset>(
  asset: T,
  template: Template
): T {
  const cleared = { ...asset };
  template.widgetArray
    .filter((widgetDef) => widgetDef.type === WIDGET_TYPES.UPLOAD)
    .forEach((widgetDef) => {
      const contents = cleared[widgetDef.fieldTitle] as
        | WithId<UploadWidgetContent>[]
        | undefined;
      if (!contents) return;
      cleared[widgetDef.fieldTitle] = contents.map((item) =>
        omit(["regenerate"], item)
      );
    });
  return cleared;
}

/**
 * Build the editor's representation of what the server has.
 *
 * @param previousAsset - the document the editor already holds, if any. Its
 * content ids are inherited by position, so a save response does not change
 * the ids of contents the editor is already showing. Omit when loading a
 * different asset, where there is no identity to carry over.
 */
export function makeLocalAssetFromSaved({
  template,
  collectionId,
  savedAsset,
  previousAsset,
}: {
  template: Template;
  collectionId: number;
  savedAsset: Asset;
  previousAsset?: Asset | UnsavedAsset | null;
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
    const previousContents = previousAsset?.[fieldTitle] as
      | WidgetContent[]
      | undefined;

    localAsset[fieldTitle] = makeWidgetContents(
      widgetDef,
      currentContents,
      previousContents
    );
  });

  return localAsset;
}

export function makeNewLocalAsset({
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

function makeWidgetContents(
  widgetDef: WidgetDef,
  currentContents?: WidgetContent[],
  previousContents?: WidgetContent[]
): WidgetContent[] {
  if (currentContents && currentContents.length > 0) {
    return currentContents.map((content, index) => {
      // ids never come back from the server, so a rebuilt content would take
      // a fresh one and remount everything keyed on it. Inherit by position.
      return {
        ...content,
        id: content.id ?? previousContents?.[index]?.id ?? crypto.randomUUID(),
      };
    });
  }
  // if no current contents, create default contents based on widget type
  return widgetDef.type === "upload"
    ? [] // uploads should be empty until a file is added
    : [createDefaultWidgetContent(widgetDef)];
}

export function migrateAssetToTemplate(asset: Asset, newTemplate: Template): Asset;
export function migrateAssetToTemplate(
  asset: UnsavedAsset,
  newTemplate: Template
): UnsavedAsset;
export function migrateAssetToTemplate(
  asset: Asset | UnsavedAsset,
  newTemplate: Template
): Asset | UnsavedAsset {
  // Create a new local asset with the new template
  const localAsset = makeNewLocalAsset({
    template: newTemplate,
    collectionId: asset.collectionId,
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
