import { describe, it, expect } from "vitest";
import { AssetCollection, Page } from "@/types";
import {
  InstanceHrefContext,
  resolveInstanceHref,
  toTitleSlug,
} from "./resolveInstanceHref";

const pages: Page[] = [
  { id: 56, title: "Our Mission" },
  {
    id: 60,
    title: "About",
    children: [{ id: 61, title: "News & Events" }],
  },
];

function makeCollection(
  id: number,
  title: string,
  children: AssetCollection[] | null = null
): AssetCollection {
  return {
    id,
    title,
    children,
    parentId: null,
    previewImageId: null,
    showInBrowse: true,
    canView: true,
    canEdit: false,
  };
}

const collections: AssetCollection[] = [
  makeCollection(7, "Archives", [
    makeCollection(8, "Photographs", [makeCollection(9, "Herero and Nama")]),
  ]),
];

function contextWithBase(basePath: string): InstanceHrefContext {
  return { basePath, pages, collections };
}

const subdirectory = contextWithBase("/archiving-memory-dev");

describe("toTitleSlug", () => {
  it("joins words with hyphens and drops punctuation", () => {
    expect(toTitleSlug("News & Events")).toBe("news-events");
    expect(toTitleSlug("  What's New?  ")).toBe("what-s-new");
  });

  it("drops accents", () => {
    expect(toTitleSlug("Café Société")).toBe("cafe-societe");
  });
});

describe("resolveInstanceHref", () => {
  it("returns null for hrefs without the ~/ prefix", () => {
    expect(resolveInstanceHref("/page/view/56", subdirectory)).toBeNull();
    expect(resolveInstanceHref("https://umn.edu", subdirectory)).toBeNull();
    expect(resolveInstanceHref("~page/our-mission", subdirectory)).toBeNull();
  });

  it("prefixes other paths with the base path", () => {
    expect(resolveInstanceHref("~/search/listCollections", subdirectory)).toBe(
      "/archiving-memory-dev/search/listCollections"
    );
    expect(resolveInstanceHref("~/", subdirectory)).toBe(
      "/archiving-memory-dev/"
    );
  });

  it("handles root, trailing-slash, and empty base paths", () => {
    const href = "~/search/listCollections";
    expect(resolveInstanceHref(href, contextWithBase(""))).toBe(
      "/search/listCollections"
    );
    expect(resolveInstanceHref(href, contextWithBase("/"))).toBe(
      "/search/listCollections"
    );
    expect(
      resolveInstanceHref(href, contextWithBase("/defaultinstance/"))
    ).toBe("/defaultinstance/search/listCollections");
  });

  it("resolves top-level and child pages by title slug", () => {
    expect(resolveInstanceHref("~/page/our-mission", subdirectory)).toBe(
      "/archiving-memory-dev/page/view/56"
    );
    expect(resolveInstanceHref("~/page/news-events", subdirectory)).toBe(
      "/archiving-memory-dev/page/view/61"
    );
  });

  it("resolves nested collections by their own title slug", () => {
    expect(resolveInstanceHref("~/collection/archives", subdirectory)).toBe(
      "/archiving-memory-dev/collections/browseCollection/7"
    );
    expect(
      resolveInstanceHref("~/collection/herero-and-nama", subdirectory)
    ).toBe("/archiving-memory-dev/collections/browseCollection/9");
  });

  it("matches slugs written with different case or a trailing slash", () => {
    expect(resolveInstanceHref("~/page/Our-Mission/", subdirectory)).toBe(
      "/archiving-memory-dev/page/view/56"
    );
  });

  it("keeps the query string and hash", () => {
    expect(resolveInstanceHref("~/page/our-mission#staff", subdirectory)).toBe(
      "/archiving-memory-dev/page/view/56#staff"
    );
    expect(
      resolveInstanceHref("~/collection/archives?sort=title#top", subdirectory)
    ).toBe(
      "/archiving-memory-dev/collections/browseCollection/7?sort=title#top"
    );
    expect(resolveInstanceHref("~/search/s/abc?q=1", subdirectory)).toBe(
      "/archiving-memory-dev/search/s/abc?q=1"
    );
  });

  it("returns null for unknown slugs", () => {
    expect(resolveInstanceHref("~/page/no-such-page", subdirectory)).toBeNull();
    expect(
      resolveInstanceHref("~/collection/no-such-collection", subdirectory)
    ).toBeNull();
  });

  it("treats longer page and collection paths as plain paths", () => {
    expect(resolveInstanceHref("~/page/view/56", subdirectory)).toBe(
      "/archiving-memory-dev/page/view/56"
    );
    expect(resolveInstanceHref("~/collections/7", subdirectory)).toBe(
      "/archiving-memory-dev/collections/7"
    );
  });
});
