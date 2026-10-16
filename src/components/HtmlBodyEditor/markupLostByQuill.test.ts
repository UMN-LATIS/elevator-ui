import { describe, it, expect } from "vitest";
import { markupLostByQuill } from "./markupLostByQuill";

describe("markupLostByQuill", () => {
  it("returns empty for plain prose", () => {
    expect(
      markupLostByQuill("<p>One.</p><h2>Title</h2><ul><li>x</li></ul>")
    ).toEqual([]);
  });

  it("returns empty for an empty or whitespace body", () => {
    expect(markupLostByQuill("")).toEqual([]);
    expect(markupLostByQuill("  \n ")).toEqual([]);
  });

  it("names a lost id", () => {
    expect(markupLostByQuill('<h2 id="hours">Hours</h2>')).toContain("@id");
  });

  it("names a lost wrapper div and its class", () => {
    const lost = markupLostByQuill('<div class="wrap"><p>x</p></div>');
    expect(lost).toContain("div");
    expect(lost).toContain("@class");
  });

  it("ignores quill's cosmetic additions", () => {
    // Quill adds rel/target to links and tbody to tables. Only loss in
    // the authored-to-survived direction counts.
    expect(
      markupLostByQuill('<p><a href="https://x.com">link</a></p>')
    ).toEqual([]);
  });

  it("catches compositional flattening, not just unknown tags", () => {
    // p and blockquote each survive alone, but quill flattens p inside
    // blockquote, dropping the p. The reporter's <div><p> claim,
    // generalized.
    expect(markupLostByQuill("<blockquote><p>a</p></blockquote>")).toContain(
      "p"
    );
    expect(markupLostByQuill("<pre><code>x</code></pre>")).toContain("code");
  });

  it("accepts quill's own output, so no page is trapped in source mode", () => {
    const flattened = markupLostByQuill('<h2 id="a">T</h2>');
    expect(flattened).not.toEqual([]);

    // A body already flattened by the editor round-trips cleanly.
    expect(markupLostByQuill("<h2>T</h2><p>Body</p>")).toEqual([]);
  });
});
