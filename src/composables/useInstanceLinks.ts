import { computed, Ref, watch } from "vue";
import { RouteLocationResolved, useRouter } from "vue-router";
import config from "@/config";
import { useInstanceNavQuery } from "@/queries/useInstanceNavQuery";
import { normalizeAssetCollections } from "@/helpers/collectionHelpers";
import {
  INSTANCE_HREF_PREFIX,
  InstanceHrefContext,
  resolveInstanceHref,
} from "@/helpers/resolveInstanceHref";

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

export function useInstanceLinks(
  containerRef: Ref<HTMLElement | undefined>,
  html: () => string
) {
  const router = useRouter();
  const { data: instanceNav } = useInstanceNavQuery();

  const hrefContext = computed(
    (): InstanceHrefContext => ({
      basePath: config.instance.base.path,
      pages: instanceNav.value?.pages ?? [],
      collections: normalizeAssetCollections(
        instanceNav.value?.collections ?? []
      ),
    })
  );

  function toAppRoute(url: URL): RouteLocationResolved | null {
    const basePath = router.options.history.base;
    const isInsideBasePath =
      url.pathname === basePath || url.pathname.startsWith(`${basePath}/`);
    if (url.origin !== window.location.origin || !isInsideBasePath) {
      return null;
    }

    const appPath = url.pathname.slice(basePath.length) || "/";
    const route = router.resolve(`${appPath}${url.search}${url.hash}`);
    // routing a catchall match shows the app's 404 for pages the server
    // still renders itself
    return route.name === "catchall" ? null : route;
  }

  function rewriteInstanceHrefs(container: HTMLElement) {
    const links = container.querySelectorAll<HTMLAnchorElement>(
      `a[href^="${INSTANCE_HREF_PREFIX}"]`
    );
    for (const link of links) {
      const href = link.getAttribute("href") ?? "";
      const resolvedHref = resolveInstanceHref(href, hrefContext.value);
      if (resolvedHref) {
        link.setAttribute("href", resolvedHref);
      } else {
        console.warn(`No page or collection matches the link "${href}"`);
      }
    }
  }

  function routeLinkClick(event: MouseEvent) {
    if (event.defaultPrevented || !isPlainLeftClick(event)) return;

    const container = event.currentTarget as HTMLElement;
    const link = (event.target as Element).closest("a");
    if (!link || !container.contains(link) || opensElsewhere(link)) return;

    const route = toAppRoute(new URL(link.href));
    if (!route) return;
    event.preventDefault();
    router.push(route);
  }

  watch(
    [containerRef, html, hrefContext],
    ([container]) => {
      if (container) rewriteInstanceHrefs(container);
    },
    { immediate: true, flush: "post" }
  );

  return { routeLinkClick };
}
