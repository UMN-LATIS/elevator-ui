import type { HasId } from "../dndTypes";
import invariant from "tiny-invariant";
import { getElementByDataId } from "./getElementByDataId";

export function flashItem({
  groupId,
  listId,
  itemId,
}: {
  groupId: HasId["id"];
  listId: HasId["id"];
  itemId: HasId["id"];
}) {
  const targetElement = getElementByDataId({ groupId, listId, itemId });
  invariant(targetElement, "Cannot flash target. Element not found");

  const flashClass = "drag-drop-list-item--flash";
  targetElement.classList.add(flashClass);

  setTimeout(() => {
    targetElement.classList.remove(flashClass);
  }, 1000);
}
