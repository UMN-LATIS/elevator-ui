import type {
  DragData,
  DragDropGroup,
  DragDropList,
  DragDropStoreState,
  DropData,
  HasId,
} from "./dndTypes";
import type { Edge } from "./utils/dnd";
import invariant from "tiny-invariant";
import { reactive } from "vue";
import * as dnd from "./utils/dnd";

const state = reactive<DragDropStoreState>({
  groupLookup: new Map(),
});

export function useDragDropStore(groupId: string | number) {
  // if the group doesn't exist, create it
  if (!state.groupLookup.has(groupId)) {
    const initialGroup: DragDropGroup = {
      id: groupId,
      listLookup: new Map(),
      sourceData: null,
      targetData: null,
    };

    state.groupLookup.set(groupId, initialGroup);
  }

  const group = state.groupLookup.get(groupId)!;

  function setList(listId: string | number, items: HasId[] = []) {
    group.listLookup.set(listId, { id: listId, items });
  }

  function removeList(listId: DragDropList["id"]) {
    group.listLookup.delete(listId);
  }

  function getList(listId: DragDropList["id"]) {
    return group.listLookup.get(listId);
  }

  function getListItem(
    listId: DragDropList["id"],
    itemId: string | number
  ): HasId | null {
    return (
      group.listLookup.get(listId)?.items.find((item) => item.id === itemId) ??
      null
    );
  }

  function moveItem(
    sourceData: { listId: HasId["id"]; sourceIndex: number },
    targetData: { listId: HasId["id"]; targetIndex: number },
    closestEdgeOfTarget: Edge | null
  ) {
    const { listId: fromListId, sourceIndex } = sourceData;
    const { listId: toListId, targetIndex } = targetData;

    const fromList = group.listLookup.get(fromListId);
    const toList = group.listLookup.get(toListId);

    invariant(fromList, `fromList with id ${fromListId} not found`);
    invariant(toList, `toList with id ${toListId} not found`);

    if (fromListId === toListId) {
      toList.items = dnd.reorderWithEdge({
        list: toList.items,
        startIndex: sourceIndex,
        indexOfTarget: targetIndex,
        closestEdgeOfTarget,
        axis: "vertical",
      });
      return;
    }

    // remove item from source list
    const [item] = fromList.items.splice(sourceIndex, 1);

    // then reorder the target list using the closest edge of the target
    toList.items = dnd.reorderWithEdge({
      list: [item, ...toList.items],
      startIndex: 0,
      // add 1 to targetIndex to account for the item we just added
      indexOfTarget: targetIndex + 1,
      closestEdgeOfTarget,
      axis: "vertical",
    });
  }

  function setSourceData(dragData: DragData | null) {
    group.sourceData = dragData;
  }

  function setTargetData(dropData: DropData | null) {
    group.targetData = dropData;
  }

  function getSourceData() {
    return group.sourceData;
  }

  function getTargetData() {
    return group.targetData;
  }

  return {
    setList,
    removeList,
    getList,
    getListItem,
    moveItem,
    getSourceData,
    setSourceData,
    getTargetData,
    setTargetData,
  };
}
