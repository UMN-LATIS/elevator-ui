import {
  DateWidgetContent,
  LocationWidgetContent,
  MultiSelectWidgetContent,
  RelatedAssetWidgetContent,
  SelectWidgetContent,
  TagListWidgetContent,
  TextAreaWidgetContent,
  TextWidgetContent,
  UploadWidgetContent,
  WidgetContent,
  WidgetType,
} from "../../src/types";

/**
 * The rows a save actually stores, for one widget.
 *
 * The real backend rebuilds the whole widget set from each payload and drops
 * every row its `hasContents()` reads as empty, so a mock that echoes the
 * payload back lets the frontend see rows the backend would have thrown away.
 */
export function saveableWidgetContents(
  contents: WidgetContent[],
  widgetType: WidgetType
): WidgetContent[] {
  return contents
    .filter(hasContentKeys)
    .map((content) => contentAsStored(content, widgetType))
    .filter((content) => isContentKeptByServer(content, widgetType));
}

/**
 * One content with the per-type cleaning the backend applies before storing.
 *
 * Text areas are only trimmed, like Textarea_contents::loadContentFromArray.
 * Stripping empty paragraphs or &nbsp; is the frontend's job, and doing it
 * here would keep e2e green if the frontend stopped.
 */
function contentAsStored(
  content: WidgetContent,
  widgetType: WidgetType
): WidgetContent {
  if (widgetType === "text area") {
    const textArea = content as TextAreaWidgetContent;
    return {
      ...textArea,
      fieldContents: (textArea.fieldContents ?? "").trim(),
    };
  }
  return content;
}

/**
 * Whether the backend's per-type `hasContents()` stores this row. The rules
 * mirror application/models/widget_contents/*.php in the elevator repo,
 * loose comparisons included: an empty string reads as null there, "0" does
 * not.
 *
 * Widget types are string literals rather than src's WIDGET_TYPES, because
 * importing a value out of src/types drags its @/ aliases and a .vue import
 * into the server.
 */
export function isContentKeptByServer(
  content: WidgetContent,
  widgetType: WidgetType
): boolean {
  switch (widgetType) {
    case "checkbox":
      return true;
    case "text":
    case "select": {
      const { fieldContents } = content as
        | TextWidgetContent
        | SelectWidgetContent;
      return !isLooselyNull(fieldContents);
    }
    case "text area": {
      const { fieldContents } = content as TextAreaWidgetContent;
      return !isLooselyNull((fieldContents ?? "").trim());
    }
    case "date": {
      const { label, start } = content as DateWidgetContent;
      // an end date without a start is dropped
      return (
        !isLooselyNull(label) ||
        !isLooselyNull(start?.text) ||
        !isLooselyNull(start?.numeric)
      );
    }
    case "location": {
      const { locationLabel, loc } = content as LocationWidgetContent;
      // an address alone does not count, and neither does a 0,0 point
      const [longitude, latitude] = loc?.coordinates ?? [];
      return (
        !isLooselyNull(locationLabel) ||
        !isLooselyNull(longitude) ||
        !isLooselyNull(latitude)
      );
    }
    case "related asset":
      return !isLooselyNull(
        (content as RelatedAssetWidgetContent).targetAssetId
      );
    case "upload":
      return !isLooselyNull((content as UploadWidgetContent).fileId);
    case "tag list": {
      const { tags } = content as TagListWidgetContent;
      return (tags ?? []).some((tag) => tag.trim() !== "");
    }
    case "multiselect": {
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

/** A corrupt `{}` or null row the db may have stored, filtered out. */
function hasContentKeys(content: WidgetContent): boolean {
  return (
    content != null &&
    typeof content === "object" &&
    Object.keys(content).length > 0
  );
}
