import invariant from "tiny-invariant";
import { useAssetStore } from "@/stores/assetStore";
import { useInstanceStore } from "@/stores/instanceStore";
import { AssetCollection } from "@/types";

const VIEW_ASSET_EVENT = "view_asset";
const DOWNLOAD_EVENT = "download";

async function getAssetDetails(assetId: string): Promise<{
  assetName: string;
  collectionId: AssetCollection["id"];
  collectionName: string;
}> {
  const assetStore = useAssetStore();
  const instanceStore = useInstanceStore();
  const asset = await assetStore.getAsset(assetId);
  const assetName = await assetStore.getAssetTitle(assetId);

  invariant(asset, `Asset with id ${assetId} not found`);

  const collection = await instanceStore.getCollectionById(asset.collectionId);

  return {
    assetName: assetName ?? "Unknown",
    collectionId: asset.collectionId,
    collectionName: collection?.title ?? "Unknown",
  };
}

export function useAnalytics() {
  const { gtag } = window;
  invariant(
    gtag,
    "Google Analytics is not loaded. Make sure to load the script in the head of your document."
  );

  async function trackViewAssetEvent(assetId: string) {
    const { assetName, collectionId, collectionName } = await getAssetDetails(
      assetId
    );

    gtag("event", VIEW_ASSET_EVENT, {
      asset_id: assetId,
      asset_name: assetName,
      collection_id: collectionId,
      collection_name: collectionName,
    });
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
    const { assetName, collectionId, collectionName } = await getAssetDetails(
      assetId
    );
    gtag("event", DOWNLOAD_EVENT, {
      collection_id: collectionId,
      asset_id: assetId,
      file_object_id: fileObjectId,
      asset_name: assetName,
      collection_name: collectionName,
      file_type: fileType,
    });
  }

  return { trackViewAssetEvent, trackDownloadEvent };
}
