import {
  Asset,
  DateWidgetContent,
  LocationWidgetContent,
  MultiSelectWidgetContent,
  PHPDateTime,
  RelatedAssetWidgetContent,
  SelectWidgetContent,
  TagListWidgetContent,
  Template,
  TextAreaWidgetContent,
  TextWidgetContent,
  UnsavedAsset,
  UploadWidgetContent,
  WidgetContent,
  WidgetType,
  WIDGET_TYPES,
} from "@/types";
import { isEmpty, omit } from "ramda";

/**
 * The asset as the server will store it. The backend rebuilds the whole
 * document from each save and drops any content row its `hasContents()`
 * reads as empty. Uuids are identity, not content, so they are omitted and
 * a recreated uuid never reads as an edit.
 */
interface AssetAsStored {
  [fieldTitle: string]: unknown;
  templateId: number;
  collectionId: number;
  readyForDisplay: boolean;
  availableAfter: string | null;
}

export function toStoredShape(
  asset: Asset | UnsavedAsset,
  template: Template
): AssetAsStored {
  const storedShape: AssetAsStored = {
    templateId: asset.templateId,
    collectionId: asset.collectionId,
    readyForDisplay: !!asset.readyForDisplay,
    availableAfter: storedAvailableAfter(
      asset.availableAfter as PHPDateTime | null
    ),
  };

  template.widgetArray.forEach((widgetDef) => {
    const contents = asset[widgetDef.fieldTitle];
    if (!Array.isArray(contents)) return;
    storedShape[widgetDef.fieldTitle] = storedWidgetContents(
      contents,
      widgetDef.type
    );
  });

  return storedShape;
}

/**
 * One widget's contents for comparison against a stored document: the wire
 * form with the uuids stripped, because a uuid is identity, not content,
 * and with each row cut down to the fields the editor owns.
 */
export function storedWidgetContents(
  contents: WidgetContent[],
  widgetType: WidgetType
): WidgetContent[] {
  return saveableWidgetContents(contents, widgetType).map((content) =>
    omit(["uuid"], contentTheEditorOwns(content, widgetType))
  );
}

/**
 * One content reduced to the fields the editor decides, for dirtiness only.
 *
 * An upload row is mostly the backend's to fill in. Upload_contents::getAsArray
 * rebuilds fileType and searchData off the file handler, sets loc from
 * coordinates it extracted, and merges label, start and end in when the file
 * carries a creation date. A freshly uploaded row therefore comes back
 * reshaped every time, and counting those fields leaves it unsaved for good:
 * the editor sends "image/jpeg" and the server answers "jpeg", forever.
 *
 * Sends are unaffected. The payload still carries every field, which matters
 * because loadContentFromArray decides an upload is an existing one by
 * finding a non-empty fileType on it.
 */
function contentTheEditorOwns(
  content: WidgetContent,
  widgetType: WidgetType
): WidgetContent {
  if (widgetType !== WIDGET_TYPES.UPLOAD) return content;
  const { fileId, fileDescription, isPrimary, sidecars } =
    content as UploadWidgetContent;
  return {
    fileId,
    fileDescription,
    isPrimary,
    // php hands an empty sidecar map back as [], the editor writes {}
    sidecars: isEmpty(sidecars ?? {}) ? {} : sidecars,
  };
}

/**
 * One widget's contents as a save sends them: corrupt rows removed,
 * text-area html cleaned, rows the server drops filtered out, and the
 * uuids kept so the server stores them.
 */
export function saveableWidgetContents(
  contents: WidgetContent[],
  widgetType: WidgetType
): WidgetContent[] {
  return contents
    .filter(hasContentKeys)
    .map((content) => contentAsSent(content, widgetType))
    .filter((content) => isContentKeptByServer(content, widgetType));
}

/** One content with the per-type cleaning a save applies before sending. */
function contentAsSent(
  content: WidgetContent,
  widgetType: WidgetType
): WidgetContent {
  if (widgetType === WIDGET_TYPES.TEXT_AREA) {
    const textArea = content as TextAreaWidgetContent;
    return {
      ...textArea,
      fieldContents: cleanTextAreaHtml(textArea.fieldContents ?? ""),
    };
  }
  if (widgetType === WIDGET_TYPES.TAG_LIST) {
    return foldPendingTagText(content as TagListWidgetContent);
  }
  return content;
}

/**
 * Whether the backend's per-type `hasContents()` stores this row. The rules
 * mirror application/models/widget_contents/*.php in the elevator repo,
 * loose comparisons included: an empty string reads as null there, "0" does
 * not.
 */
export function isContentKeptByServer(
  content: WidgetContent,
  widgetType: WidgetType
): boolean {
  switch (widgetType) {
    case WIDGET_TYPES.CHECKBOX:
      return true;
    case WIDGET_TYPES.TEXT:
    case WIDGET_TYPES.SELECT: {
      const { fieldContents } = content as
        | TextWidgetContent
        | SelectWidgetContent;
      return !isLooselyNull(fieldContents);
    }
    case WIDGET_TYPES.TEXT_AREA: {
      const { fieldContents } = content as TextAreaWidgetContent;
      return !isLooselyNull(cleanTextAreaHtml(fieldContents ?? ""));
    }
    case WIDGET_TYPES.DATE: {
      const { label, start } = content as DateWidgetContent;
      // an end date without a start is dropped
      return (
        !isLooselyNull(label) ||
        !isLooselyNull(start?.text) ||
        !isLooselyNull(start?.numeric)
      );
    }
    case WIDGET_TYPES.LOCATION: {
      const { locationLabel, loc } = content as LocationWidgetContent;
      // an address alone does not count, and neither does a 0,0 point
      const [longitude, latitude] = loc?.coordinates ?? [];
      return (
        !isLooselyNull(locationLabel) ||
        !isLooselyNull(longitude) ||
        !isLooselyNull(latitude)
      );
    }
    case WIDGET_TYPES.RELATED_ASSET:
      return !isLooselyNull(
        (content as RelatedAssetWidgetContent).targetAssetId
      );
    case WIDGET_TYPES.UPLOAD:
      return !isLooselyNull((content as UploadWidgetContent).fileId);
    case WIDGET_TYPES.TAG_LIST: {
      const { tags, pendingText } = content as TagListWidgetContent;
      // pendingText counts: the save folds it into tags before sending
      return (
        (tags ?? []).some((tag) => tag.trim() !== "") ||
        (pendingText ?? "").trim() !== ""
      );
    }
    case WIDGET_TYPES.MULTISELECT: {
      const { fieldContents } = content as MultiSelectWidgetContent;
      return Object.values(fieldContents ?? {}).some(
        (value) => !isLooselyNull(value)
      );
    }
    default:
      return true;
  }
}

/** PHP's `$value != NULL`: null, undefined, "", 0, and false all match. */
function isLooselyNull(value: unknown): boolean {
  return value == null || value === "" || value === 0 || value === false;
}

/** A corrupt `{}` or null row the backend may have stored, filtered out. */
function hasContentKeys(content: WidgetContent): boolean {
  return (
    content != null &&
    typeof content === "object" &&
    Object.keys(content).length > 0
  );
}

/** Tag text still sitting in the input is saved as a tag, not dropped. */
function foldPendingTagText(content: TagListWidgetContent): WidgetContent {
  const { pendingText, ...rest } = content;
  const pendingTag = (pendingText ?? "").trim();
  const tags = rest.tags ?? [];
  const shouldAddPendingTag = pendingTag !== "" && !tags.includes(pendingTag);
  const nextTags = shouldAddPendingTag ? [...tags, pendingTag] : tags;
  return { ...rest, tags: nextTags };
}

const EMPTY_PARAGRAPHS = /<p>(&nbsp;|\s|<br>)*<\/p>/g;

/** What the save pipeline does to text-area html before sending. */
export function cleanTextAreaHtml(html: string): string {
  return html
    .replace(EMPTY_PARAGRAPHS, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/**
 * The calendar date of an availableAfter, for comparison only. The editor
 * writes date-only strings while the server echoes full DateTimes, so
 * equality lives at day precision. Saves still send the stored `date`
 * verbatim, because truncating it would strip a time of day that legacy
 * data may carry.
 */
export function storedAvailableAfter(
  availableAfter: PHPDateTime | null | undefined
): string | null {
  if (!availableAfter?.date) return null;
  return availableAfter.date.slice(0, 10);
}
