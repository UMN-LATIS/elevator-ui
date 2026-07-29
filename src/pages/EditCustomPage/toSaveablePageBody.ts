import { cleanHtml } from "@/helpers/htmlCleaningHelpers";

/**
 * Sanitizes a custom page body for saving: removes what can execute
 * (script tags, on* handlers, javascript: URLs) and keeps every other
 * tag and attribute. Only instance admins author pages, so the touch
 * stays light.
 */
export function toSaveablePageBody(html: string): string {
  // TODO: light-touch sanitizer. Delegates to the lossy Quill round trip
  // so the tests below reproduce issue #623.
  return cleanHtml(html);
}
