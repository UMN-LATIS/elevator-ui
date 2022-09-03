import { ref, type Ref, watch, isRef } from "vue";
import { useAssetStore } from "@/stores/newAssetStore";
import { getWidgetPropsByFieldTitle } from "@/Helpers/displayUtils";

/**
 * reactively get an asset's title by an id
 */
export function useAssetTitle(
  assetId: Ref<string | null> | string | null
): Ref<string> {
  const assetStore = useAssetStore();
  const title = ref("");

  // turn into ref if it's not
  const assetIdRef = isRef(assetId) ? assetId : ref(assetId);

  watch(assetIdRef, async () => {
    if (!assetIdRef.value) {
      // reset to empty string if nullish
      title.value = "";
      return;
    }

    const [asset, template] = await Promise.all([
      assetStore.fetchAsset(assetIdRef.value),
      assetStore.fetchTemplateForAsset(assetIdRef.value),
    ]);

    if (!asset || !template) {
      title.value = "(Not Found)";
      return;
    }

    if (!asset.titleObject) {
      title.value = "Untitled";
      return;
    }

    const titleWidget = getWidgetPropsByFieldTitle(template, asset.titleObject);

    title.value = titleWidget?.label || "Untitled";
  });

  return title;
}
