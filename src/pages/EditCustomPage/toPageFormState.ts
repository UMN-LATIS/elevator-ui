import type { CustomPageSummary } from "@/types";

/** The page fields an admin edits, apart from the body. */
export interface PageFormState {
  title: string;
  parent: number | null;
  includeInHeader: boolean;
}

export function emptyPageFormState(): PageFormState {
  return {
    title: "",
    parent: null,
    includeInHeader: false,
  };
}

/**
 * Reads a stored page into the shape the form holds.
 *
 * Seeding the form and checking it for unsaved changes both go through here,
 * so the two cannot disagree about which fields count or what they are named.
 */
export function toPageFormState(page: CustomPageSummary): PageFormState {
  return {
    title: page.title,
    parent: page.parentId,
    includeInHeader: page.includeInHeader,
  };
}
