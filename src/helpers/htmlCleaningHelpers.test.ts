import { describe, it, expect } from "vitest";
import { cleanHtml } from "./htmlCleaningHelpers";

describe("cleanHtml", () => {
  it("preserves img tags with src and alt attributes", () => {
    const html =
      '<p>Before</p><p><img src="https://example.com/photo.jpg" alt="A photo"></p><p>After</p>';
    const result = cleanHtml(html);

    expect(result).toContain("<img");
    expect(result).toContain('src="https://example.com/photo.jpg"');
    expect(result).toContain('alt="A photo"');
  });

  it("strips inline style attributes from img tags", () => {
    const html =
      '<p><img src="https://example.com/photo.jpg" alt="test" style="width: 300px; cursor: nwse-resize;"></p>';
    const result = cleanHtml(html);

    expect(result).toContain("<img");
    expect(result).toContain('src="https://example.com/photo.jpg"');
    expect(result).not.toContain("style=");
  });
});
