export { DRAG_DATA_KEY, DROP_DATA_KEY } from "./constants";

export interface HasId {
  id: string | number;
  [key: string]: unknown;
}

export interface DragDropList {
  id: HasId["id"];
  items: HasId[];
}

export interface DragDropGroup {
  id: HasId["id"];
  listLookup: Map<DragDropList["id"], DragDropList>;
  sourceData: DragData | null;
  targetData: DropData | null;
}

export interface DragDropStoreState {
  groupLookup: Map<DragDropGroup["id"], DragDropGroup>;
}

export interface RawDragData extends Record<string | symbol, unknown> {
  sourceId: HasId["id"];
  sourceIndex: number;
  groupId: HasId["id"];
  listId: HasId["id"];
}

export interface DragData extends RawDragData {
  [DRAG_DATA_KEY: symbol]: true;
}

export interface RawDropData extends Record<string | symbol, unknown> {
  targetId: HasId["id"];
  targetIndex: number;
  groupId: HasId["id"];
  listId: HasId["id"];
}

export interface DropData extends RawDropData {
  [DROP_DATA_KEY: symbol]: true;
}

export type MoveDirection = "nextIndex" | "prevIndex" | "nextList" | "prevList";

export type CSSClass = string | Record<string, boolean> | CSSClass[];
