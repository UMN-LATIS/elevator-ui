import { describe, it, expect } from "vitest";
import { toSaveablePageBody } from "./toSaveablePageBody";

// Issue #623: the page save path strips ids, classes, wrapper elements
// and embeds. Only instance admins author pages, so saving should remove
// what can execute and keep everything else.

describe("toSaveablePageBody", () => {
  describe("keeps admin-authored attributes", () => {
    it("keeps id", () => {
      const result = toSaveablePageBody('<h2 id="hours">Hours</h2>');
      expect(result).toContain('id="hours"');
    });

    it("keeps class", () => {
      const result = toSaveablePageBody('<p class="lead">Hi</p>');
      expect(result).toContain('class="lead"');
    });

    it("keeps data attributes", () => {
      const result = toSaveablePageBody('<p data-track="hero">Hi</p>');
      expect(result).toContain('data-track="hero"');
    });

    it("keeps colspan on table cells", () => {
      const result = toSaveablePageBody(
        '<table><tbody><tr><td colspan="2">x</td></tr></tbody></table>'
      );
      expect(result).toContain('colspan="2"');
    });

    it("keeps inline styles", () => {
      const result = toSaveablePageBody('<p style="color: red">Red</p>');
      expect(result).toContain("color: red");
    });
  });

  describe("keeps admin-authored elements", () => {
    it("keeps wrapping divs", () => {
      const result = toSaveablePageBody(
        '<div class="wrapper"><p>Inside</p></div>'
      );
      expect(result).toContain("<div");
      expect(result).toContain("<p>Inside</p>");
    });

    it("keeps section and figure", () => {
      const result = toSaveablePageBody(
        "<section><figure><img src='a.jpg'><figcaption>cap</figcaption></figure></section>"
      );
      expect(result).toContain("<section");
      expect(result).toContain("<figure");
      expect(result).toContain("<figcaption");
    });

    it("keeps details and summary", () => {
      const result = toSaveablePageBody(
        "<details><summary>More</summary><p>Hidden</p></details>"
      );
      expect(result).toContain("<details");
      expect(result).toContain("<summary");
    });

    it("keeps iframe embeds", () => {
      const result = toSaveablePageBody(
        '<iframe src="https://www.youtube.com/embed/abc" width="560"></iframe>'
      );
      expect(result).toContain("<iframe");
      expect(result).toContain('src="https://www.youtube.com/embed/abc"');
    });

    it("keeps style blocks", () => {
      const result = toSaveablePageBody(
        "<style>.callout{color:maroon}</style><p>Hi</p>"
      );
      expect(result).toContain("<style");
      expect(result).toContain(".callout{color:maroon}");
    });

    it("keeps inline svg", () => {
      const result = toSaveablePageBody(
        '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"></circle></svg>'
      );
      expect(result).toContain("<svg");
      expect(result).toContain("<circle");
    });
  });

  describe("removes what can execute", () => {
    it("removes script tags without leaking their text into the page", () => {
      const result = toSaveablePageBody(
        '<p id="a">Hi</p><script>alert(1)</script>'
      );
      expect(result).not.toContain("<script");
      expect(result).not.toContain("alert(1)");
      expect(result).toContain('id="a"');
    });

    it("removes event handler attributes, keeping the element", () => {
      const result = toSaveablePageBody(
        '<img src="a.jpg" onerror="alert(1)" id="pic">'
      );
      expect(result).not.toContain("onerror");
      expect(result).toContain('src="a.jpg"');
      expect(result).toContain('id="pic"');
    });

    it("removes javascript: urls, keeping the link", () => {
      const result = toSaveablePageBody(
        '<a href="javascript:alert(1)" id="l">x</a>'
      );
      expect(result).not.toContain("javascript:");
      expect(result).toContain('id="l"');
    });
  });

  describe("removes editor chrome", () => {
    it("scrubs cursor styles left by the image resize module", () => {
      const result = toSaveablePageBody(
        '<p><img src="a.jpg" style="width: 300px; cursor: nwse-resize;"></p>'
      );
      expect(result).not.toContain("cursor");
      expect(result).toContain("width: 300px");
    });
  });

  it("is idempotent", () => {
    const authored =
      '<div class="wrap" id="hero"><h2 id="intro">Hi</h2>' +
      '<iframe src="https://example.com/embed"></iframe></div>';
    const once = toSaveablePageBody(authored);
    expect(toSaveablePageBody(once)).toBe(once);
  });
});
