import type { ManageableDrawer } from "@/types";

// A drawer's title is nullable and never validated on create, so every
// table showing a drawer falls back to the same label instead of
// rendering a blank cell.
export function toDrawerTitle(drawer: ManageableDrawer): string {
  return drawer.title || `Drawer ${drawer.id}`;
}
