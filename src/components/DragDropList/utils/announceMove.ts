import type { HasId } from "../dndTypes";
import * as dnd from "./dnd";

export function announceMove({
  itemId,
  sourceIndex,
  sourceListId,
  targetIndex,
  targetListId,
}: {
  itemId: HasId["id"];
  sourceIndex: number;
  sourceListId: HasId["id"];
  targetIndex: number;
  targetListId: HasId["id"];
}) {
  // if same list, announce reorder
  if (sourceListId === targetListId) {
    dnd.announce(
      `Reordered item ${itemId} from position ${sourceIndex + 1} to position ${
        targetIndex + 1
      }`
    );
    return;
  }

  dnd.announce(
    `Moved item ${itemId} from list ${sourceListId} to list ${targetListId}`
  );
}
