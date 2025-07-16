import type { RawDragData, DragData, RawDropData, DropData } from "../dndTypes";
import { DRAG_DATA_KEY, DROP_DATA_KEY } from "../constants";

export function makeDragData(data: RawDragData): DragData {
  return {
    ...data,
    [DRAG_DATA_KEY]: true,
  };
}

export function isDragData(
  data: Record<string | symbol, unknown>
): data is DragData {
  return Boolean(data[DRAG_DATA_KEY]);
}

export function makeDropData(data: RawDropData): DropData {
  return {
    ...data,
    [DROP_DATA_KEY]: true,
  };
}

export function isDropData(
  data: Record<string | symbol, unknown>
): data is DropData {
  return Boolean(data[DROP_DATA_KEY]);
}
