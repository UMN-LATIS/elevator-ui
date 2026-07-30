import { describe, it, expect } from "vitest";
import Quill from "quill";
import { fromQuillHtml } from "./fromQuillHtml";

function serializeThroughQuill(html: string): string {
  const quill = new Quill(document.createElement("div"));
  quill.setContents(quill.clipboard.convert({ html }));
  return quill.getSemanticHTML();
}

describe("fromQuillHtml", () => {
  it("gives back the spaces quill escaped", () => {
    expect(fromQuillHtml("<p>Open&nbsp;9&nbsp;to&nbsp;5</p>")).toBe(
      "<p>Open 9 to 5</p>"
    );
  });

  it("leaves markup alone", () => {
    const html = '<p><a href="https://x.com">Link</a></p><ul><li>One</li></ul>';
    expect(fromQuillHtml(html)).toBe(html);
  });

  it("clears every entity quill's serializer adds", () => {
    const serialized = serializeThroughQuill(
      "<h2>Visiting hours</h2><p>Open 9 to 5 every weekday.</p>"
    );
    expect(serialized).toContain("&nbsp;");

    expect(fromQuillHtml(serialized)).toBe(
      "<h2>Visiting hours</h2><p>Open 9 to 5 every weekday.</p>"
    );
  });
});
