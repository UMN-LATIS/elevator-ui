import { ref, type Ref, watch } from "vue";
import { useAssetStore } from "@/stores/newAssetStore";

const assetStore = useAssetStore();

async function fetchAssetTitle(assetId): Promise<string> {
  if (!assetId) return "";
  const asset = await assetStore.fetchAsset(assetId);
  return asset?.title?.[0] ?? "(No Title)";
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
