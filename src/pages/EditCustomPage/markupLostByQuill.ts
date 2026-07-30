import { toQuillSimplifiedHtml } from "./toQuillSimplifiedHtml";

// Every tag name and attribute name appearing anywhere in the markup.
// Attribute names are prefixed with "@" to keep the two namespaces apart.
function inventoryOf(html: string): Set<string> {
  const host = document.createElement("div");
  host.innerHTML = html;

  const found = new Set<string>();
  for (const element of Array.from(host.querySelectorAll("*"))) {
    found.add(element.tagName.toLowerCase());
    for (const attribute of Array.from(element.attributes)) {
      found.add(`@${attribute.name}`);
    }
  }
  return found;
}

/**
 * Names the tags and attributes Quill would destroy if this HTML were
 * loaded into the rich text editor, e.g. ["div", "@id"]. Empty when the
 * markup survives. Asks Quill directly rather than consulting a list of
 * supported tags, so the answer cannot drift when Quill upgrades or a
 * plugin registers a new format.
 *
 * Detects loss of tags and attributes, not changes to attribute values
 * or text. Quill's cosmetic additions (rel, target, tbody) never count
 * as loss because only one direction is compared.
 */
export function markupLostByQuill(html: string): string[] {
  if (!html.trim()) return [];

  const authored = inventoryOf(html);
  const survived = inventoryOf(toQuillSimplifiedHtml(html));

  return [...authored].filter((item) => !survived.has(item));
}

/** Reads an inventory back to an admin: `<div>, class=..., id=...`. */
export function toMarkupList(items: string[]): string {
  return items
    .map((item) =>
      item.startsWith("@") ? `${item.slice(1)}=...` : `<${item}>`
    )
    .join(", ");
}
