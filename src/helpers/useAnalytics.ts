import invariant from "tiny-invariant";
import { useAssetStore } from "@/stores/assetStore";
import { useInstanceStore } from "@/stores/instanceStore";
import { AssetCollection } from "@/types";

const VIEW_ASSET_EVENT = "view_asset";
const DOWNLOAD_EVENT = "download";

async function getAssetDetails(assetId: string): Promise<{
  asset_id: string;
  asset_name: string;
  collection_id: AssetCollection["id"];
  collection_name: string;
  instance_id: number;
  instance_name: string;
}> {
  const assetStore = useAssetStore();
  const instanceStore = useInstanceStore();
  const asset = await assetStore.getAsset(assetId);
  const assetName = await assetStore.getAssetTitle(assetId);

  invariant(asset, `Asset with id ${assetId} not found`);

  const collection = await instanceStore.getCollectionById(asset.collectionId);

  return {
    asset_id: assetId,
    asset_name: assetName ?? "Unknown",
    collection_id: asset.collectionId,
    collection_name: collection?.title ?? "Unknown",
    instance_id: instanceStore.instance.id ?? -1,
    instance_name: instanceStore.instance.name ?? "Unknown",
  };
}

export function useAnalytics() {
  const { gtag } = window;

  async function trackViewAssetEvent(assetId: string) {
    if (!gtag) return;

    const assetDetails = await getAssetDetails(assetId);
    gtag("event", VIEW_ASSET_EVENT, assetDetails);
  }

  async function trackDownloadEvent({
    fileObjectId,
    assetId,
    fileType,
  }: {
    fileObjectId: string;
    assetId: string;
    fileType: string;
  }) {
    if (!gtag) return;

    const assetDetails = await getAssetDetails(assetId);
    gtag("event", DOWNLOAD_EVENT, {
      ...assetDetails,
      file_object_id: fileObjectId,
      file_type: fileType,
    });
  }

  return { trackViewAssetEvent, trackDownloadEvent };
}
