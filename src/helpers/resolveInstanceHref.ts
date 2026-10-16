import { AssetCollection, Page } from "@/types";

export const INSTANCE_HREF_PREFIX = "~/";

export interface InstanceHrefContext {
  basePath: string;
  pages: Page[];
  collections: AssetCollection[];
}

interface TitledTree {
  id: number;
  title: string;
  children?: TitledTree[] | null;
}

export function toTitleSlug(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function findIdByTitleSlug(items: TitledTree[], slug: string): number | null {
  for (const item of items) {
    if (toTitleSlug(item.title) === slug) return item.id;
    const childId = findIdByTitleSlug(item.children ?? [], slug);
    if (childId !== null) return childId;
  }
  return null;
}

/**
 * Returns null when the href doesn't start with `~/`, or when no page or
 * collection title matches the slug.
 */
export function resolveInstanceHref(
  href: string,
  context: InstanceHrefContext
): string | null {
  if (!href.startsWith(INSTANCE_HREF_PREFIX)) return null;

  const basePath = context.basePath.replace(/\/+$/, "");
  const [, path, queryAndHash] =
    href.slice(INSTANCE_HREF_PREFIX.length).match(/^([^?#]*)(.*)$/) ?? [];
  const [kind, slug, ...rest] = path.split("/").filter(Boolean);
  const isSlugLink = slug !== undefined && rest.length === 0;

  if (isSlugLink && kind === "page") {
    const pageId = findIdByTitleSlug(context.pages, toTitleSlug(slug));
    return pageId === null
      ? null
      : `${basePath}/page/view/${pageId}${queryAndHash}`;
  }

  if (isSlugLink && kind === "collection") {
    const collectionId = findIdByTitleSlug(
      context.collections,
      toTitleSlug(slug)
    );
    return collectionId === null
      ? null
      : `${basePath}/collections/browseCollection/${collectionId}${queryAndHash}`;
  }

  return `${basePath}/${path}${queryAndHash}`;
}
