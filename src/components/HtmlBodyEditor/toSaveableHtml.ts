import DOMPurify from "dompurify";

// @umn-latis/quill-better-image-module writes cursor styles onto images
// while the admin drags a resize handle. They are editor chrome, not
// content, so scrub them before saving.
function removeCursorStyles(html: string): string {
  const host = document.createElement("div");
  host.innerHTML = html;

  for (const element of Array.from(
    host.querySelectorAll<HTMLElement>("[style]")
  )) {
    element.style.removeProperty("cursor");
    if (!element.getAttribute("style")) {
      element.removeAttribute("style");
    }
  }

  return host.innerHTML;
}

/**
 * Sanitizes the way SanitizedHTML renders with the same
 * `addTags`: script tags, on* handlers and javascript:
 * URLs go, and the rest of the markup stays.
 */
export function toSaveableHtml(html: string, addTags: string[]): string {
  const sanitized = DOMPurify.sanitize(html, {
    ADD_TAGS: ["iframe", ...addTags],
    ADD_ATTR: ["target"],
    // Matches SanitizedHTML, which moves a leading <style>
    // into <head> and drops it unless style is allowed.
    // Forcing the body here would save styles the page
    // never shows.
    FORCE_BODY: addTags.includes("style"),
  });

  return removeCursorStyles(sanitized);
}
