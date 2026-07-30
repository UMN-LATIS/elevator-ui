import Quill from "quill";
import { fromQuillHtml } from "./fromQuillHtml";

/**
 * The body as the visual editor would hold it, with everything outside
 * Quill's formats gone. Call this to apply that loss deliberately instead
 * of letting the editor apply it on mount.
 *
 * One pass does not settle the markup. A second pass can still wrap a
 * bare link in a paragraph and add rel and target, and a third is stable.
 */
export function toQuillSimplifiedHtml(html: string): string {
  const quill = new Quill(document.createElement("div"));
  quill.setContents(quill.clipboard.convert({ html }));
  return fromQuillHtml(quill.getSemanticHTML());
}
