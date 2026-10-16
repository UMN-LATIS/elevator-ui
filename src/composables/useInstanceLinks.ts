import DOMPurify, { Config } from "dompurify";
import { useRouter } from "vue-router";

const INSTANCE_HREF_PREFIX = "~/";

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

export function useInstanceLinks() {
  const router = useRouter();

  function rewriteInstanceHref(node: Node) {
    if (!(node instanceof HTMLAnchorElement)) return;
    const href = node.getAttribute("href");
    if (!href?.startsWith(INSTANCE_HREF_PREFIX)) return;

    const appPath = href.slice(INSTANCE_HREF_PREFIX.length - 1);
    node.setAttribute("href", router.resolve(appPath).href);
    node.dataset.appPath = appPath;
  }

  function sanitizeWithInstanceHrefs(html: string, config: Config): string {
    // a hook left registered would also rewrite `~/` hrefs in
    // toSaveablePageBody, which saves page bodies with the same DOMPurify
    DOMPurify.addHook("afterSanitizeAttributes", rewriteInstanceHref);
    try {
      return DOMPurify.sanitize(html, config);
    } finally {
      DOMPurify.removeHook("afterSanitizeAttributes", rewriteInstanceHref);
    }
  }

  function routeInstanceLinkClick(event: MouseEvent) {
    if (event.defaultPrevented || !isPlainLeftClick(event)) return;

    const container = event.currentTarget as HTMLElement;
    const link = (event.target as Element).closest<HTMLAnchorElement>(
      "a[data-app-path]"
    );
    if (!link || !container.contains(link) || opensElsewhere(link)) return;

    const route = router.resolve(link.dataset.appPath ?? "/");
    // routing a catchall match shows the app's 404 for pages the server
    // still renders itself
    if (route.name === "catchall") return;

    event.preventDefault();
    router.push(route);
  }

  return { sanitizeWithInstanceHrefs, routeInstanceLinkClick };
}
