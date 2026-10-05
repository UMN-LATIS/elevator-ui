import { tryFocus } from "@/helpers/tryFocus";
import { GROUP_TYPES, type PermissionsGroup } from "@/types";

function toAddRowButtonSelector(group: PermissionsGroup): string {
  return group.type === GROUP_TYPES.USER
    ? `[data-group-add-member="${group.id}"]`
    : `[data-group-entry-add-button="${group.id}"]`;
}

export async function openGroupAddRow(group: PermissionsGroup): Promise<void> {
  try {
    const addRowButton = await tryFocus(toAddRowButtonSelector(group));
    addRowButton.click();
  } catch (error) {
    console.warn("Could not open the new group's add row", error);
  }
}
