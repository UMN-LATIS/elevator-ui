/**
 * Turns Quill's serialization into HTML fit to store, giving back the
 * ordinary spaces it escaped.
 *
 * `getSemanticHTML` writes every space as `&nbsp;`, which grows a 20 kB
 * body to 32 kB and stops the text wrapping. No authored non-breaking
 * space is at risk: Quill collapses those to ordinary spaces while
 * parsing, so every `&nbsp;` on the way out is one Quill added.
 */
export function fromQuillHtml(html: string): string {
  return html.replace(/&nbsp;/g, " ");
}
