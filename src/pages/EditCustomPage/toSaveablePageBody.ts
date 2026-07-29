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
 * Sanitizes a custom page body for saving: removes what can execute
 * (script tags, on* handlers, javascript: URLs) and keeps every other
 * tag and attribute. Only instance admins author pages, so the touch
 * stays light and matches what SanitizedHTML enforces at render.
 */
export function toSaveablePageBody(html: string): string {
  const sanitized = DOMPurify.sanitize(html, {
    ADD_TAGS: ["iframe", "style"],
    ADD_ATTR: ["target"],
    // keep a leading <style> in the body instead of letting the parser
    // relocate it into <head>, where it would be dropped
    FORCE_BODY: true,
  });

  return removeCursorStyles(sanitized);
}
