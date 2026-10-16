const INSTANCE_HREF_PREFIX = "~/";

export function withInstanceHrefs(
  html: string,
  toHref: (appPath: string) => string
): string {
  if (!html.includes(INSTANCE_HREF_PREFIX)) return html;

  const template = document.createElement("template");
  template.innerHTML = html;

  const links = template.content.querySelectorAll<HTMLAnchorElement>(
    `a[href^="${INSTANCE_HREF_PREFIX}"]`
  );
  for (const link of links) {
    const appPath = (link.getAttribute("href") ?? "").slice(
      INSTANCE_HREF_PREFIX.length - 1
    );
    link.setAttribute("href", toHref(appPath));
    link.dataset.appPath = appPath;
  }

  return template.innerHTML;
}

function isPlainLeftClick(event: MouseEvent): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

function opensElsewhere(link: HTMLAnchorElement): boolean {
  return (
    (link.target !== "" && link.target !== "_self") ||
    link.hasAttribute("download")
  );
}

/**
 * Returns null unless the event is a plain left click on a link that
 * `withInstanceHrefs` rewrote, inside the element the listener is on.
 */
export function clickedInstanceLinkPath(event: MouseEvent): string | null {
  if (event.defaultPrevented || !isPlainLeftClick(event)) return null;

  const container = event.currentTarget as HTMLElement;
  const link = (event.target as Element).closest<HTMLAnchorElement>(
    "a[data-app-path]"
  );
  if (!link || !container.contains(link) || opensElsewhere(link)) return null;

  return link.dataset.appPath ?? null;
}
