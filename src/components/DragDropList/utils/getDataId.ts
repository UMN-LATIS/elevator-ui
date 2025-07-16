export function getDataId({
  groupId,
  listId,
  itemId,
}: {
  groupId: string | number;
  listId: string | number;
  itemId: string | number;
}) {
  return `${groupId}-${listId}-${itemId}`;
}
