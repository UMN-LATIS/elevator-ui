import { computed, Ref, watch } from "vue";
import config from "@/config";
import { useInstanceNavQuery } from "@/queries/useInstanceNavQuery";
import { normalizeAssetCollections } from "@/helpers/collectionHelpers";
import {
  INSTANCE_HREF_PREFIX,
  InstanceHrefContext,
  resolveInstanceHref,
} from "@/helpers/resolveInstanceHref";

export function useRewriteInstanceHrefs(
  containerRef: Ref<HTMLElement | undefined>,
  html: () => string
) {
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

  watch(
    [containerRef, html, hrefContext],
    ([container]) => {
      if (container) rewriteInstanceHrefs(container);
    },
    { immediate: true, flush: "post" }
  );
}
