import Quill from "quill";
import { pipe } from "ramda";

/**
 * Removes empty paragraph tags that Quill sometimes generates.
 */
const removeEmptyParagraphs = (html: string): string =>
  html.replace(/<p>(&nbsp;|\s|<br>)*<\/p>/g, "");

/**
 * Converts Quill's internal HTML format to semantic HTML using Quill's
 * built-in getSemanticHTML() method. This ensures consistent, clean output.
 */
const convertToSemanticHtml = (html: string): string => {
  const quill = new Quill(document.createElement("div"));
  const delta = quill.clipboard.convert({ html });
  quill.setContents(delta);
  return quill.getSemanticHTML();
};

/**
 * Normalizes spaces by converting &nbsp; entities back to regular spaces.
 * Quill converts spaces to &nbsp; during semantic HTML conversion.
 */
const normalizeSpaces = (html: string): string =>
  html.replace(/&nbsp;/g, " ").trim();

/**
 * Cleans HTML content by removing empty paragraphs, converting to semantic
 * HTML, and normalizing spaces. Use this before saving editor content.
 */
export const cleanHtml = (html: string): string => {
  if (!html) return "";

  return pipe(
    removeEmptyParagraphs,
    convertToSemanticHtml,
    normalizeSpaces
  )(html);
};
