import { ref, type Ref } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { markupLostByQuill } from "./markupLostByQuill";
import { toQuillSimplifiedHtml } from "./toQuillSimplifiedHtml";

/** What simple formatting took out, and the body it took it out of. */
export interface Simplification {
  htmlBeforeSimplifying: string;
  markupRemoved: string[];
}

export type BodyMarkupStyle =
  | { name: "customHtml" }
  | { name: "simpleFormatting"; simplification: Simplification | null };

export type BodyMarkupStyleName = BodyMarkupStyle["name"];

export interface PageBodyEditor {
  html: Ref<string>;
  markupStyle: Ref<BodyMarkupStyle>;
  markupLostBySimplifying: Ref<string[]>;
  loadStoredBody: (storedHtml: string) => void;
  editBody: (nextHtml: string) => void;
  chooseMarkupStyle: (name: BodyMarkupStyleName) => void;
  undoSimplifying: () => void;
}

/**
 * Holds the one copy of a custom page body, along with the markup style
 * the admin writes it in. Every way the body can change is a function
 * here and nothing else writes to it, so opening a page and saving it
 * cannot alter what is stored.
 */
export function usePageBodyEditor(): PageBodyEditor {
  const html = ref("");
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

  function loadStoredBody(storedHtml: string): void {
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

  return {
    html,
    markupStyle,
    markupLostBySimplifying,
    loadStoredBody,
    editBody,
    chooseMarkupStyle,
    undoSimplifying,
  };
}
