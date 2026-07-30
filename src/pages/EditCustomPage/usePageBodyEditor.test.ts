import { describe, it, expect } from "vitest";
import { usePageBodyEditor } from "./usePageBodyEditor";

const LEGACY_BODY =
  '<div class="wrapper" id="hero"><h2 id="hours">Hours</h2><p>Open 9 to 5</p></div>';
const PROSE_BODY = "<h2>Hours</h2><p>Open 9 to 5</p>";

describe("usePageBodyEditor", () => {
  it("opens a body quill would damage in custom html, unchanged", () => {
    const editor = usePageBodyEditor();
    editor.loadStoredBody(LEGACY_BODY);

    expect(editor.markupStyle.value.name).toBe("customHtml");
    expect(editor.html.value).toBe(LEGACY_BODY);
    expect(editor.markupLostBySimplifying.value).toContain("div");
    expect(editor.markupLostBySimplifying.value).toContain("@id");
  });

  it("opens a body quill can hold in simple formatting", () => {
    const editor = usePageBodyEditor();
    editor.loadStoredBody(PROSE_BODY);

    expect(editor.markupStyle.value.name).toBe("simpleFormatting");
    expect(editor.html.value).toBe(PROSE_BODY);
    expect(editor.markupLostBySimplifying.value).toEqual([]);
  });

  it("records what simple formatting removed, and the body it removed it from", () => {
    const editor = usePageBodyEditor();
    editor.loadStoredBody(LEGACY_BODY);
    editor.chooseMarkupStyle("simpleFormatting");

    expect(editor.html.value).not.toContain("<div");
    expect(editor.html.value).toContain("Hours");

    const style = editor.markupStyle.value;
    if (style.name !== "simpleFormatting") throw new Error("wrong style");

    expect(style.simplification?.htmlBeforeSimplifying).toBe(LEGACY_BODY);
    expect(style.simplification?.markupRemoved).toContain("div");
  });

  it("puts the whole body back when the switch is undone", () => {
    const editor = usePageBodyEditor();
    editor.loadStoredBody(LEGACY_BODY);
    editor.chooseMarkupStyle("simpleFormatting");
    editor.undoSimplifying();

    expect(editor.html.value).toBe(LEGACY_BODY);
    expect(editor.markupStyle.value.name).toBe("customHtml");
  });

  it("stops offering the undo once the admin edits the simplified body", () => {
    const editor = usePageBodyEditor();
    editor.loadStoredBody(LEGACY_BODY);
    editor.chooseMarkupStyle("simpleFormatting");
    editor.editBody("<p>Rewritten</p>");

    const style = editor.markupStyle.value;
    if (style.name !== "simpleFormatting") throw new Error("wrong style");
    expect(style.simplification).toBeNull();

    editor.undoSimplifying();
    expect(editor.html.value).toBe("<p>Rewritten</p>");
  });

  it("offers no undo when the switch removed nothing", () => {
    const editor = usePageBodyEditor();
    editor.loadStoredBody(PROSE_BODY);
    editor.chooseMarkupStyle("customHtml");
    editor.chooseMarkupStyle("simpleFormatting");

    const style = editor.markupStyle.value;
    if (style.name !== "simpleFormatting") throw new Error("wrong style");
    expect(style.simplification).toBeNull();
  });

  it("leaves the body alone when moving to custom html", () => {
    const editor = usePageBodyEditor();
    editor.loadStoredBody(PROSE_BODY);
    editor.chooseMarkupStyle("customHtml");

    expect(editor.html.value).toBe(PROSE_BODY);
    expect(editor.markupStyle.value.name).toBe("customHtml");
  });

  it("keeps the stored body byte-identical until the admin edits it", () => {
    const editor = usePageBodyEditor();
    editor.loadStoredBody(LEGACY_BODY);

    expect(editor.html.value).toBe(LEGACY_BODY);

    editor.editBody(`${LEGACY_BODY}<p>More</p>`);
    expect(editor.html.value).toBe(`${LEGACY_BODY}<p>More</p>`);
  });
});
