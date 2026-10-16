import Quill from "quill";
import { fromQuillHtml } from "./fromQuillHtml";

/**
 * The body as the visual editor would hold it, with everything outside
 * Quill's formats gone. Call this to apply that loss deliberately instead
 * of letting the editor apply it on mount.
 */
export function toQuillSimplifiedHtml(html: string): string {
  const quill = new Quill(document.createElement("div"));
  quill.setContents(quill.clipboard.convert({ html }));
  return fromQuillHtml(quill.getSemanticHTML());
}
