import { provide } from "vue";
import {
  ASSET_EDITOR_PROVIDE_KEY,
  ASSET_VALIDATION_PROVIDE_KEY,
  EDITOR_HOST_PROVIDE_KEY,
} from "@/constants/constants";
import {
  createEditorHost,
  createSessionHandle,
  type AssetEditor,
  type EditorHost,
  type EditorHostHandlers,
  type SessionHandleOptions,
} from "./useAssetEditor";
import { createAssetValidation } from "./useAssetValidation";

/**
 * Builds the page's editor host, the one model every editing session on the
 * page shares, and hands it to everything rendered below. Each page gets
 * its own host, so two tabs editing different assets never touch each
 * other's state.
 *
 * Call during setup, since it provides.
 */
export function provideEditorHost(handlers: EditorHostHandlers): EditorHost {
  const host = createEditorHost(handlers);
  provide(EDITOR_HOST_PROVIDE_KEY, host);
  return host;
}

/**
 * Builds one editing surface's session handle and hands it, plus the
 * validation derived from it, to everything rendered below. The page
 * provides its root handle over the host's; an inline related asset
 * provides its own child handle over its parent's.
 *
 * Call during setup, since it provides.
 */
export function provideAssetEditor(
  host: EditorHost,
  options: SessionHandleOptions
): AssetEditor {
  const assetEditor = createSessionHandle(host, options);
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
