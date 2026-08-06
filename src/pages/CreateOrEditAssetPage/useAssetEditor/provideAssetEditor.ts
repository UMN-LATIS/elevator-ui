import { provide } from "vue";
import {
  ASSET_EDITOR_PROVIDE_KEY,
  ASSET_VALIDATION_PROVIDE_KEY,
} from "@/constants/constants";
import {
  createAssetEditor,
  type AssetEditor,
  type EditorCommandHandlers,
} from "./useAssetEditor";
import { createAssetValidation } from "./useAssetValidation";

/**
 * Builds an editor for the page that owns it and hands it, plus the
 * validation derived from it, to everything rendered below.
 *
 * Each page gets its own editor, so two tabs editing different assets never
 * touch each other's state, and an inline related asset provides its own
 * editor over its parent's.
 *
 * Call during setup, since it provides.
 */
export function provideAssetEditor(
  commandHandlers: EditorCommandHandlers
): AssetEditor {
  const assetEditor = createAssetEditor(commandHandlers);
  provide(ASSET_EDITOR_PROVIDE_KEY, assetEditor);

  provide(
    ASSET_VALIDATION_PROVIDE_KEY,
    createAssetValidation(
      () => assetEditor.localAsset,
      () => assetEditor.template,
      assetEditor.getWidgetInstanceId
    )
  );

  return assetEditor;
}
