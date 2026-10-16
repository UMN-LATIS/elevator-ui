import { describe, it, expect } from "vitest";
import DOMPurify from "dompurify";
import { withInstanceHrefs } from "./instanceLinks";

const toHref = (appPath: string) => `/defaultinstance${appPath}`;

describe("withInstanceHrefs", () => {
  it("rewrites ~/ hrefs and marks them with their app path", () => {
    expect(
      withInstanceHrefs('<a href="~/page/view/57?x=1#top">About</a>', toHref)
    ).toBe(
      '<a href="/defaultinstance/page/view/57?x=1#top" data-app-path="/page/view/57?x=1#top">About</a>'
    );
    expect(withInstanceHrefs('<a href="~/">Home</a>', toHref)).toBe(
      '<a href="/defaultinstance/" data-app-path="/">Home</a>'
    );
  });

  it("leaves other links alone", () => {
    const html =
      '<a href="/defaultinstance/page/view/3">a</a><a href="https://umn.edu">b</a><a href="#top">c</a><img src="~/x.png">';
    expect(withInstanceHrefs(html, toHref)).toBe(html);
  });

  it("keeps sanitized header HTML that starts with style and link tags", () => {
    const html = DOMPurify.sanitize(
      '<link rel="preconnect" href="https://fonts.example"><style>.x { color: red; }</style><nav><iframe title="map"></iframe><a href="~/search/listCollections">Collections</a></nav>',
      { ADD_TAGS: ["iframe", "style", "link"], FORCE_BODY: true }
    );
    expect(withInstanceHrefs(html, toHref)).toBe(
      html.replace(
        'href="~/search/listCollections"',
        'href="/defaultinstance/search/listCollections" data-app-path="/search/listCollections"'
      )
    );
  });
});
