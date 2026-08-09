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
import { omit } from "ramda";

/**
 * The asset as the server will store it.
 *
 * The backend rebuilds the whole document from each save and drops any
 * content row its `hasContents()` reads as empty, so what comes back from a
 * save is this view, not what the editor sent. Comparing two assets in this
 * view answers "would saving one over the other change anything", which is
 * what dirtiness and content-id matching need.
 *
 * Only editable fields appear: the widget fields plus the non-widget
 * properties a save sends. Content uuids are identity, not content, and are
 * omitted so a reminted uuid never reads as an edit.
 */
export interface AssetAsStored {
  [fieldTitle: string]: unknown;
  templateId: number;
  collectionId: number;
  readyForDisplay: boolean;
  availableAfter: string | null;
}

export function normalizeAssetForSave(
  asset: Asset | UnsavedAsset,
  template: Template
): AssetAsStored {
  const normalized: AssetAsStored = {
    templateId: asset.templateId,
    collectionId: asset.collectionId,
    readyForDisplay: !!asset.readyForDisplay,
    availableAfter: normalizeAvailableAfter(
      asset.availableAfter as PHPDateTime | null
    ),
  };

  template.widgetArray.forEach((widgetDef) => {
    const contents = asset[widgetDef.fieldTitle];
    if (!Array.isArray(contents)) return;
    normalized[widgetDef.fieldTitle] = normalizeWidgetContents(
      contents,
      widgetDef.type
    );
  });

  return normalized;
}

/**
 * One widget's contents for comparison against a stored document: the wire
 * form with the uuids stripped, because a uuid is identity, not content.
 */
export function normalizeWidgetContents(
  contents: WidgetContent[],
  widgetType: WidgetType
): WidgetContent[] {
  return saveableWidgetContents(contents, widgetType).map((content) =>
    omit(["uuid"], content)
  );
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
    .map((content) => {
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
    })
    .filter((content) => doesServerKeepContent(content, widgetType));
}

/**
 * Whether the backend's per-type `hasContents()` stores this row. The rules
 * mirror application/models/widget_contents/*.php in the elevator repo,
 * loose comparisons included: an empty string reads as null there, "0" does
 * not.
 */
export function doesServerKeepContent(
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
export function normalizeAvailableAfter(
  availableAfter: PHPDateTime | null | undefined
): string | null {
  if (!availableAfter?.date) return null;
  return availableAfter.date.slice(0, 10);
}
