import type { Asset, UploadWidgetContent } from "@/types";

/**
 * Whether a saved asset already holds this file in the given upload widget.
 *
 * @param savedAsset - The asset as last returned by the server, or null before
 * the first save.
 * @param fieldTitle - The upload widget's field on the asset.
 *
 * @example
 * ```ts
 * // The metadata API rejects a file the asset has not claimed yet, so wait
 * // for the save to land before asking about it.
 * const isFileSaved = computed(() =>
 *   hasSavedFileInWidget(assetEditor.savedAsset, props.widgetDef.fieldTitle, props.item.fileId)
 * );
 * ```
 */
export function hasSavedFileInWidget(
  savedAsset: Asset | null,
  fieldTitle: string,
  fileId: string
): boolean {
  if (!savedAsset || !fileId) {
    return false;
  }

  const widgetContents = savedAsset[fieldTitle];
  if (!Array.isArray(widgetContents)) {
    return false;
  }

  return widgetContents.some(
    (content) => (content as UploadWidgetContent)?.fileId === fileId
  );
}
