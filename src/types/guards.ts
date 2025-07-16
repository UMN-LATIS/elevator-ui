import type {
  WidgetContent,
  TextWidgetContent,
  CheckboxWidgetContent,
  DateWidgetContent,
  LocationWidgetContent,
  RelatedAssetWidgetContent,
  SelectWidgetContent,
  TagListWidgetContent,
  TextAreaWidgetContent,
  UploadWidgetContent,
  MultiSelectWidgetContent,
  DateMoment,
  BroadcastMessage,
  RelatedAssetSaveMessage,
} from "@/types";

import { SAVE_RELATED_ASSET_TYPE } from "@/constants/constants";

/**
 * Base type guard for checking if a value is a WidgetContent
 */
export function isWidgetContent(value: unknown): value is WidgetContent {
  return (
    typeof value === "object" &&
    value !== null &&
    ("isPrimary" in value || Object.keys(value).length > 0)
  );
}

/**
 * Type guard for TextWidgetContent
 */
export function isTextWidgetContent(
  value: unknown
): value is TextWidgetContent {
  return (
    isWidgetContent(value) &&
    "fieldContents" in value &&
    typeof (value as TextWidgetContent).fieldContents === "string"
  );
}

/**
 * Type guard for CheckboxWidgetContent
 */
export function isCheckboxWidgetContent(
  value: unknown
): value is CheckboxWidgetContent {
  return (
    isWidgetContent(value) &&
    "fieldContents" in value &&
    typeof (value as CheckboxWidgetContent).fieldContents === "boolean"
  );
}

/**
 * Type guard for DateMoment
 */
export function isDateMoment(value: unknown): value is DateMoment {
  return (
    typeof value === "object" &&
    value !== null &&
    "text" in value &&
    "numeric" in value &&
    (value.text === null || typeof value.text === "string") &&
    (value.numeric === null || typeof value.numeric === "string")
  );
}

/**
 * Type guard for DateWidgetContent
 */
export function isDateWidgetContent(
  value: unknown
): value is DateWidgetContent {
  return (
    isWidgetContent(value) &&
    "label" in value &&
    typeof (value as DateWidgetContent).label === "string" &&
    "start" in value &&
    isDateMoment((value as DateWidgetContent).start) &&
    "end" in value &&
    isDateMoment((value as DateWidgetContent).end)
  );
}

/**
 * Type guard for LocationWidgetContent
 */
export function isLocationWidgetContent(
  value: unknown
): value is LocationWidgetContent {
  return (
    isWidgetContent(value) &&
    "locationLabel" in value &&
    (value.locationLabel === null || typeof value.locationLabel === "string") &&
    "address" in value &&
    (value.address === null || typeof value.address === "string") &&
    "loc" in value
  );
}

/**
 * Type guard for RelatedAssetWidgetContent
 */
export function isRelatedAssetWidgetContent(
  value: unknown
): value is RelatedAssetWidgetContent {
  return (
    isWidgetContent(value) &&
    "targetAssetId" in value &&
    (value.targetAssetId === null || typeof value.targetAssetId === "string") &&
    "label" in value &&
    (value.label === null || typeof value.label === "string")
  );
}

/**
 * Type guard for SelectWidgetContent
 */
export function isSelectWidgetContent(
  value: unknown
): value is SelectWidgetContent {
  return (
    isWidgetContent(value) &&
    "fieldContents" in value &&
    (value.fieldContents === null || typeof value.fieldContents === "string")
  );
}

/**
 * Type guard for TagListWidgetContent
 */
export function isTagListWidgetContent(
  value: unknown
): value is TagListWidgetContent {
  return (
    isWidgetContent(value) &&
    "tags" in value &&
    (value.tags === null || Array.isArray(value.tags))
  );
}

/**
 * Type guard for TextAreaWidgetContent
 */
export function isTextAreaWidgetContent(
  value: unknown
): value is TextAreaWidgetContent {
  return (
    isWidgetContent(value) &&
    "fieldContents" in value &&
    (value.fieldContents === null || typeof value.fieldContents === "string")
  );
}

/**
 * Type guard for UploadWidgetContent
 */
export function isUploadWidgetContent(
  value: unknown
): value is UploadWidgetContent {
  return (
    isWidgetContent(value) &&
    "fileId" in value &&
    typeof (value as UploadWidgetContent).fileId === "string" &&
    "fileDescription" in value &&
    typeof (value as UploadWidgetContent).fileDescription === "string" &&
    "fileType" in value &&
    typeof (value as UploadWidgetContent).fileType === "string"
  );
}

/**
 * Type guard for MultiSelectWidgetContent
 */
export function isMultiSelectWidgetContent(
  value: unknown
): value is MultiSelectWidgetContent {
  return (
    isWidgetContent(value) &&
    "fieldContents" in value &&
    typeof (value as MultiSelectWidgetContent).fieldContents === "object" &&
    (value as MultiSelectWidgetContent).fieldContents !== null
  );
}

export const isSaveRelatedAssetMessage = (
  message: BroadcastMessage
): message is RelatedAssetSaveMessage => {
  return message.type === SAVE_RELATED_ASSET_TYPE;
};
