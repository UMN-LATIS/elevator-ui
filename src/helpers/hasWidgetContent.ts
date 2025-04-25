import { WidgetProps } from "@/types";
import {
  isTextWidgetContent,
  isCheckboxWidgetContent,
  isDateWidgetContent,
  isLocationWidgetContent,
  isRelatedAssetWidgetContent,
  isSelectWidgetContent,
  isTagListWidgetContent,
  isTextAreaWidgetContent,
  isUploadWidgetContent,
  isMultiSelectWidgetContent,
} from "../types/guards";

/**
 * Checks if a TextWidgetContent array has at least one non-empty string
 */
export function hasTextContent(contents: unknown[]): boolean {
  if (!Array.isArray(contents)) return false;

  return contents.some(
    (content) =>
      isTextWidgetContent(content) &&
      typeof content.fieldContents === "string" &&
      content.fieldContents.trim() !== ""
  );
}

/**
 * Checks if a CheckboxWidgetContent array has at least one item
 * (does not need to check if the item is true or false)
 */
export function hasCheckboxContent(contents: unknown[]): boolean {
  if (!Array.isArray(contents)) return false;

  return (
    contents.length > 0 &&
    contents.some((content) => isCheckboxWidgetContent(content))
  );
}

/**
 * Checks if a DateWidgetContent array has at least one valid date
 */
export function hasDateContent(contents: unknown[]): boolean {
  if (!Array.isArray(contents)) return false;

  return contents.some((content) => {
    if (!isDateWidgetContent(content)) return false;

    // both range and moments need numeric and text
    if (!content.start.numeric || !content.start.text?.trim()) {
      return false;
    }

    // if this is a moment, we need to check the end date too
    if (!content.range) {
      return true;
    }

    // otherwise the end date needs to be valid too
    return !!content.end.numeric && !!content.end.text?.trim();
  });
}

/**
 * Checks if a LocationWidgetContent array has at least one valid location
 */
export function hasLocationContent(contents: unknown[]): boolean {
  if (!Array.isArray(contents)) return false;

  return contents.some(
    (content) =>
      isLocationWidgetContent(content) &&
      // location coordinates need to be an array of length 2
      Array.isArray(content.loc?.coordinates) &&
      content.loc.coordinates.length === 2 &&
      // coordinates need to be numbers
      content.loc.coordinates.every(
        (coord) => typeof coord === "number" && !isNaN(coord)
      )
  );
}

/**
 * Checks if a RelatedAssetWidgetContent array has at least one valid related asset
 */
export function hasRelatedAssetContent(contents: unknown[]): boolean {
  if (!Array.isArray(contents)) return false;

  return contents.some(
    (content) => isRelatedAssetWidgetContent(content) && !!content.targetAssetId
  );
}

/**
 * Checks if a SelectWidgetContent array has at least one non-empty selection
 */
export function hasSelectContent(contents: unknown[]): boolean {
  if (!Array.isArray(contents)) return false;

  return contents.some(
    (content) => isSelectWidgetContent(content) && !!content.fieldContents
  );
}

/**
 * Checks if a TagListWidgetContent array has at least one tag
 */
export function hasTagListContent(contents: unknown[]): boolean {
  if (!Array.isArray(contents)) return false;

  return contents.some(
    (content) =>
      isTagListWidgetContent(content) &&
      Array.isArray(content.tags) &&
      content.tags.length > 0
  );
}

/**
 * Checks if a TextAreaWidgetContent array has at least one non-empty text area
 */
export function hasTextAreaContent(contents: unknown[]): boolean {
  if (!Array.isArray(contents)) return false;

  return contents.some(
    (content) =>
      isTextAreaWidgetContent(content) && !!content.fieldContents?.trim().length
  );
}

/**
 * Checks if an UploadWidgetContent array has at least one valid upload
 */
export function hasUploadContent(contents: unknown[]): boolean {
  if (!Array.isArray(contents)) return false;

  return contents.some(
    (content) =>
      isUploadWidgetContent(content) &&
      content.fileId !== "" &&
      content.fileType !== ""
  );
}

/**
 * Checks if a MultiSelectWidgetContent array has at least one selection
 */
export function hasMultiSelectContent(contents: unknown[]): boolean {
  if (!Array.isArray(contents)) return false;

  return contents.some(
    (content) =>
      isMultiSelectWidgetContent(content) &&
      content.fieldContents !== null &&
      typeof content.fieldContents === "object" &&
      Object.keys(content.fieldContents).length > 0
  );
}

/**
 * Generic function to check if any widget content array has valid content
 * based on the widget type
 */
export function hasWidgetContent(
  contents: unknown[],
  widgetType: WidgetProps["type"] | "any"
): boolean {
  switch (widgetType) {
    case "text":
      return hasTextContent(contents);
    case "checkbox":
      return hasCheckboxContent(contents);
    case "date":
      return hasDateContent(contents);
    case "location":
      return hasLocationContent(contents);
    case "related asset":
      return hasRelatedAssetContent(contents);
    case "select":
      return hasSelectContent(contents);
    case "tag list":
      return hasTagListContent(contents);
    case "text area":
      return hasTextAreaContent(contents);
    case "upload":
      return hasUploadContent(contents);
    case "multiselect":
      return hasMultiSelectContent(contents);
    case "any":
      return (
        hasTextContent(contents) ||
        hasCheckboxContent(contents) ||
        hasDateContent(contents) ||
        hasLocationContent(contents) ||
        hasRelatedAssetContent(contents) ||
        hasSelectContent(contents) ||
        hasTagListContent(contents) ||
        hasTextAreaContent(contents) ||
        hasUploadContent(contents) ||
        hasMultiSelectContent(contents)
      );
    default:
      return false;
  }
}
