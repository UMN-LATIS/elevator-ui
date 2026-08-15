import {
  Asset,
  Template,
  TextWidgetContent,
  UnsavedAsset,
  UploadWidgetContent,
  WidgetContent,
  WidgetDef,
  WIDGET_TYPES,
  WithUuid,
} from "@/types";
import { createDefaultWidgetContent } from "@/helpers/createDefaultWidgetContents";
import {
  doesServerKeepContent,
  normalizeAssetForSave,
} from "./normalizeAssetForSave";
import { equals, omit } from "ramda";

/**
 * Asset properties the user can change outside the template's widgets.
 * `templateId` is here because migrating an asset to another template is an
 * edit like any other.
 */
const EDITABLE_NON_WIDGET_PROPERTIES = [
  "collectionId",
  "availableAfter",
  "readyForDisplay",
  "templateId",
];

function editableAssetKeys(template: Template): string[] {
  const widgetKeys = template.widgetArray.map(
    (widgetDef) => widgetDef.fieldTitle
  );
  return [...EDITABLE_NON_WIDGET_PROPERTIES, ...widgetKeys];
}

/**
 * A widget content's uuid is identity, not content, so two contents holding
 * the same values are the same content whatever their uuids say.
 */
function fieldValueWithoutContentUuids(value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  return value.map((item) =>
    item && typeof item === "object" ? omit(["uuid"], item) : item
  );
}

function isFieldUnchanged(draftValue: unknown, savedValue: unknown): boolean {
  return equals(
    fieldValueWithoutContentUuids(draftValue),
    fieldValueWithoutContentUuids(savedValue)
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
 * Whether saving `draft` would change the server's stored asset, comparing
 * both as the server will store them. Blank rows, uncleaned html, and date
 * formatting differences do not count: the server never stores them, so a
 * save cannot settle them and they must not read as unsaved work.
 *
 * @param savedAsset - the stored baseline, or the pristine scaffold when
 * the draft has never been saved.
 */
export function wouldSaveChangeStoredAsset({
  draft,
  savedAsset,
  template,
}: {
  draft: Asset | UnsavedAsset;
  savedAsset: Asset | UnsavedAsset;
  template: Template;
}): boolean {
  return !equals(
    normalizeAssetForSave(draft, template),
    normalizeAssetForSave(savedAsset, template)
  );
}

/**
 * A content's `regenerate` asks the next save to rebuild its derived files, so
 * once that save has happened it has served its purpose. `regenerate` is
 * client-only and never comes back from the server, so leaving it set would
 * read as an unsaved change forever.
 *
 * Accepts a Partial so the editor's `edits` can be cleared the same way as a
 * whole document. Fields the partial does not hold are left alone.
 */
export function clearUploadRegenerationFlags<
  T extends Asset | UnsavedAsset | Partial<Asset>
>(asset: T, template: Template): T {
  const cleared = { ...asset };
  template.widgetArray
    .filter((widgetDef) => widgetDef.type === WIDGET_TYPES.UPLOAD)
    .forEach((widgetDef) => {
      const contents = cleared[widgetDef.fieldTitle] as
        | WithUuid<UploadWidgetContent>[]
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
 * The result keeps the document's own templateId and collectionId even when
 * `template` is newer: while a template migration is unsaved, the baseline
 * must keep saying what the server has, or the migration would read as
 * already saved.
 *
 * @param previousAsset - the document the editor already holds, if any.
 * Contents without stored uuids inherit its uuids by position, so a save
 * response does not change the identity of contents the editor is already
 * showing. Omit when loading a different asset, where there is no identity
 * to carry over.
 */
export function toLocalAssetFromSavedAsset({
  template,
  savedAsset,
  previousAsset,
}: {
  template: Template;
  savedAsset: Asset;
  previousAsset?: Asset | UnsavedAsset | null;
}): Asset {
  const localAsset = { ...savedAsset };

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

  template.widgetArray.forEach((widgetDef) => {
    initialAsset[widgetDef.fieldTitle] = makeWidgetContents(widgetDef);
  });

  return initialAsset;
}

/**
 * Uuids given to contents that arrived without one, keyed by the content
 * object itself. TanStack's structural sharing keeps unchanged contents'
 * object references across refetches, so scaffolding a document from before
 * uuids were stored again finds the same identities instead of reminting,
 * which would remount every component keyed on them.
 */
const mintedContentUuids = new WeakMap<WidgetContent, string>();

/** The content's uuid, read through WidgetContent's unknown-typed keys. */
function storedContentUuid(content: WidgetContent | undefined): string | null {
  return typeof content?.uuid === "string" ? content.uuid : null;
}

function makeWidgetContents(
  widgetDef: WidgetDef,
  currentContents?: WidgetContent[],
  previousContents?: WidgetContent[]
): WidgetContent[] {
  if (currentContents && currentContents.length > 0) {
    const keptPreviousContents = (previousContents ?? []).filter((content) =>
      doesServerKeepContent(content, widgetDef.type)
    );
    return currentContents.map((content, index) => {
      // a uuid the server stored comes back and wins
      const serverUuid = storedContentUuid(content);
      if (serverUuid) return { ...content, uuid: serverUuid };

      const uuid =
        // a content scaffolded before keeps the uuid it was given
        mintedContentUuids.get(content) ??
        // a fresh content without one inherits by position from the rows the
        // editor was showing, but only from rows the server keeps: the
        // response holds no blank rows, so a blank row on screen must not
        // push uuids off their contents
        storedContentUuid(keptPreviousContents[index]) ??
        crypto.randomUUID();
      mintedContentUuids.set(content, uuid);
      return { ...content, uuid };
    });
  }
  if (widgetDef.type === "upload") {
    return []; // uploads should be empty until a file is added
  }
  // the blank item scaffolded for a field the server stored nothing for
  // keeps the identity of the blank item already on screen, so the
  // component tree keyed on it (an inline related asset's editor, and any
  // draft typed into it) survives a save's read-back
  const scaffoldContent = createDefaultWidgetContent(widgetDef);
  const previousUuid = storedContentUuid(previousContents?.[0]);
  return [
    previousUuid ? { ...scaffoldContent, uuid: previousUuid } : scaffoldContent,
  ];
}

/**
 * The title to show for the asset being edited: the title property when the
 * server has set it, otherwise the text of the title widget. `title_1` is the
 * title widget's conventional fieldTitle.
 */
export function getAssetDisplayTitle(asset: Asset | UnsavedAsset): string {
  const propertyTitle = asset.title?.[0];

  const titleWidgetContents = asset.title_1 as TextWidgetContent[] | undefined;
  const widgetTitle = titleWidgetContents?.[0]?.fieldContents;

  return propertyTitle || widgetTitle || "";
}

export function migrateAssetToTemplate(
  asset: Asset,
  newTemplate: Template
): Asset;
export function migrateAssetToTemplate(
  asset: UnsavedAsset,
  newTemplate: Template
): UnsavedAsset;
export function migrateAssetToTemplate(
  asset: Asset | UnsavedAsset,
  newTemplate: Template
): Asset | UnsavedAsset {
  const localAsset = makeNewLocalAsset({
    template: newTemplate,
    collectionId: asset.collectionId,
  });

  return {
    ...localAsset,
    ...asset,
    templateId: newTemplate.templateId,
  };
}
