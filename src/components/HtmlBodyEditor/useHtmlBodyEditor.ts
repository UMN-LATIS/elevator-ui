import { ref, type Ref } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { markupLostByQuill } from "./markupLostByQuill";
import { toQuillSimplifiedHtml } from "./toQuillSimplifiedHtml";
import { toSaveableHtml } from "./toSaveableHtml";

/** What simple formatting took out, and the body it took it out of. */
export interface Simplification {
  htmlBeforeSimplifying: string;
  markupRemoved: string[];
}

export type BodyMarkupStyle =
  | { name: "customHtml" }
  | { name: "simpleFormatting"; simplification: Simplification | null };

export type BodyMarkupStyleName = BodyMarkupStyle["name"];

export interface HtmlBodyEditorModel {
  html: Ref<string>;
  addTags: string[];
  markupStyle: Ref<BodyMarkupStyle>;
  markupLostBySimplifying: Ref<string[]>;
  loadStoredBody: (storedHtml: string) => void;
  editBody: (nextHtml: string) => void;
  chooseMarkupStyle: (name: BodyMarkupStyleName) => void;
  undoSimplifying: () => void;
  htmlToSave: () => string;
}

export function useHtmlBodyEditor({
  addTags,
}: {
  addTags: string[];
}): HtmlBodyEditorModel {
  const html = ref("");
  let storedHtml = "";
  const markupStyle = ref<BodyMarkupStyle>({
    name: "simpleFormatting",
    simplification: null,
  });
  const markupLostBySimplifying = ref<string[]>([]);

  function refreshMarkupLostBySimplifying(): void {
    markupLostBySimplifying.value =
      markupStyle.value.name === "customHtml"
        ? markupLostByQuill(html.value)
        : [];
  }

  // Answering costs a parse through a throwaway Quill, measured at 22 ms
  // on a 20 kB page, so while the admin types the warning trails them.
  const refreshMarkupLostWhenTypingSettles = useDebounceFn(
    refreshMarkupLostBySimplifying,
    400
  );

  function loadStoredBody(nextStoredHtml: string): void {
    storedHtml = nextStoredHtml;
    html.value = storedHtml;
    markupStyle.value = markupLostByQuill(storedHtml).length
      ? { name: "customHtml" }
      : { name: "simpleFormatting", simplification: null };
    refreshMarkupLostBySimplifying();
  }

  function editBody(nextHtml: string): void {
    html.value = nextHtml;

    if (markupStyle.value.name === "simpleFormatting") {
      // undoing now would throw away the edit, so stop offering it
      markupStyle.value = { name: "simpleFormatting", simplification: null };
    }

    refreshMarkupLostWhenTypingSettles();
  }

  function chooseSimpleFormatting(): void {
    const htmlBeforeSimplifying = html.value;
    // read the body as it stands rather than the answer on screen, in
    // case the admin switches within the debounce window
    const markupRemoved = markupLostByQuill(htmlBeforeSimplifying);

    html.value = toQuillSimplifiedHtml(htmlBeforeSimplifying);
    markupStyle.value = {
      name: "simpleFormatting",
      simplification: markupRemoved.length
        ? { htmlBeforeSimplifying, markupRemoved }
        : null,
    };
  }

  function chooseMarkupStyle(name: BodyMarkupStyleName): void {
    if (name === markupStyle.value.name) return;

    if (name === "customHtml") {
      // the visual editor reports its html as the admin types, so leaving
      // it needs no read and loses nothing
      markupStyle.value = { name: "customHtml" };
    } else {
      chooseSimpleFormatting();
    }

    refreshMarkupLostBySimplifying();
  }

  function undoSimplifying(): void {
    const style = markupStyle.value;
    if (style.name !== "simpleFormatting" || !style.simplification) return;

    html.value = style.simplification.htmlBeforeSimplifying;
    markupStyle.value = { name: "customHtml" };
    refreshMarkupLostBySimplifying();
  }

  /** The stored body, byte for byte, until the admin edits it. */
  function htmlToSave(): string {
    // Sanitizing re-serializes the markup, so sending an
    // unedited body through it would rewrite stored HTML
    // on a save that only changed another field.
    const isUnedited = html.value === storedHtml;
    if (isUnedited) return storedHtml;

    return toSaveableHtml(html.value, addTags);
  }

  return {
    html,
    addTags,
    markupStyle,
    markupLostBySimplifying,
    loadStoredBody,
    editBody,
    chooseMarkupStyle,
    undoSimplifying,
    htmlToSave,
  };
}
