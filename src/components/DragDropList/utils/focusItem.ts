import type { HasId } from "../dndTypes";
import invariant from "tiny-invariant";
import { getDataId } from "./getDataId";

export function focusItem({
  groupId,
  listId,
  itemId,
}: {
  groupId: HasId["id"];
  listId: HasId["id"];
  itemId: HasId["id"];
}) {
  const dataId = getDataId({ groupId, listId, itemId });
  const handleElement = document.querySelector(
    `[data-simple-dnd-id="${dataId}"] .drag-handle`
  ) as HTMLButtonElement | undefined;
  invariant(handleElement, `Could not focus element with id ${dataId}`);
  handleElement.focus();
}
