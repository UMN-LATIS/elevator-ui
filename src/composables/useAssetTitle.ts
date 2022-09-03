import { ref, type Ref, watch } from "vue";
import { useAssetStore } from "@/stores/newAssetStore";
import { getWidgetPropsByFieldTitle } from "@/Helpers/displayUtils";

const assetStore = useAssetStore();

async function fetchAssetTitle(assetId): Promise<string> {
  if (!assetId) return "";

  const [asset, template] = await Promise.all([
    assetStore.fetchAsset(assetId),
    assetStore.fetchTemplateForAsset(assetId),
  ]);

  if (!asset || !template) return "(Not Found)";
  if (!asset.titleObject) return "Untitled";

  const titleWidget = getWidgetPropsByFieldTitle(template, asset.titleObject);
  return titleWidget?.label ?? "Untitled";
}

/**
 * gets a ref with the asset's title for
 * a given asset id
 */
export function useAssetTitle(assetId: string | null): Ref<string> {
  const title = ref("");

  watch(
    () => assetId,
    async () => (title.value = await fetchAssetTitle(assetId)),
    // run when first called
    { immediate: true }
  );
  return title;
}
