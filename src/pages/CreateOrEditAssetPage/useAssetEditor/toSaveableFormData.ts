import {
  Asset,
  Template,
  UnsavedAsset,
  WidgetContent,
  PHPDateTime,
  UpdateAssetRequestFormData,
  TextAreaWidgetContent,
  WIDGET_TYPES,
} from "@/types";
import { isTextAreaWidgetContent } from "@/types/guards";
import Quill from "quill";
import { omit, pipe } from "ramda";

const removeEmptyParagraphs = (html: string) => {
  const emptyParagraphRegex = /<p>(&nbsp;|\s|<br>)*<\/p>/g;
  return html.replace(emptyParagraphRegex, "");
};

const convertQuillHtmlToSemanticHtml = (html: string) => {
  const quill = new Quill(document.createElement("div"));
  const delta = quill.clipboard.convert({ html });
  quill.setContents(delta);
  return quill.getSemanticHTML();
};

const normalizeSpaces = (html: string) => {
  // quill converts every space to &nbsp; when transforming to
  // semantic html, so convert them back to normal spaces
  return html.replace(/&nbsp;/g, " ").trim();
};

function cleanTextAreaWidgetContent(
  widgetContent: TextAreaWidgetContent
): TextAreaWidgetContent {
  if (!widgetContent.fieldContents) return widgetContent;

  const cleaned = pipe(
    removeEmptyParagraphs,
    convertQuillHtmlToSemanticHtml,
    normalizeSpaces
  )(widgetContent.fieldContents);

  return {
    ...widgetContent,
    fieldContents: cleaned,
  };
}

// remove ids, and clean any widget content items
// (e.g. scrub html in text area widget content)
function prepWidgetsForSave(
  asset: Asset | UnsavedAsset,
  template: Template
): Record<string, WidgetContent[]> {
  return template.widgetArray.reduce((acc, widgetDef) => {
    const widgetContents = asset[widgetDef.fieldTitle] as
      | WidgetContent[]
      | undefined;

    if (!widgetContents) return acc;

    const cleanedWidgetContents = widgetContents.map((content) => {
      const contentWithoutId = omit(["id"], content);
      if (
        widgetDef.type === WIDGET_TYPES.TEXT_AREA &&
        isTextAreaWidgetContent(contentWithoutId)
      ) {
        return cleanTextAreaWidgetContent(contentWithoutId);
      }
      return contentWithoutId;
    });

    return {
      ...acc,
      [widgetDef.fieldTitle]: cleanedWidgetContents,
    };
  }, {} as Record<string, WidgetContent[]>);
}

export function toSaveableFormData(
  asset: Asset | UnsavedAsset,
  template: Template
): UpdateAssetRequestFormData {
  return {
    objectId: asset.assetId ?? "",
    templateId: String(asset.templateId),
    newTemplateId: String(asset.templateId),
    collectionId: String(asset.collectionId),
    newCollectionId: String(asset.collectionId),
    readyForDisplay: asset.readyForDisplay as boolean,
    availableAfter: (asset.availableAfter as PHPDateTime)?.date,
    ...prepWidgetsForSave(asset, template),
  };
}
