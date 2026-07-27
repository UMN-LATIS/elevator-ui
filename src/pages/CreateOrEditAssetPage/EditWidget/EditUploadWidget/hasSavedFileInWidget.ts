import type { Asset } from "@/types";
import { isUploadWidgetContent } from "@/types/guards";

/**
 * Whether the server has linked this file to the asset under the given widget.
 *
 * @param savedAsset - As last returned by the server, null before first save.
 * @param fieldTitle - The widget's field name on the asset.
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
    (content) => isUploadWidgetContent(content) && content.fileId === fileId
  );
}
