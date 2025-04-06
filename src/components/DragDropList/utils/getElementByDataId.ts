import { getDataId } from "./getDataId";

export function getElementByDataId({
  groupId,
  listId,
  itemId,
}: {
  groupId: string | number;
  listId: string | number;
  itemId: string | number;
}): HTMLElement | null {
  const dataId = getDataId({ groupId, listId, itemId });
  const selector = `[data-simple-dnd-id="${dataId}"]`;
  return (document.querySelector(selector) as HTMLElement) ?? null;
}
