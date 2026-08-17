import invariant from "tiny-invariant";
import { useAssetStore } from "@/stores/assetStore";
import { appQueryClient } from "@/queries/queryClient";
import { INSTANCENAV_QUERY_KEY } from "@/queries/queryKeys";
import { ApiInstanceNavResponse, AssetCollection } from "@/types";
import {
  normalizeAssetCollections,
  toCollectionIndex,
} from "@/helpers/collectionHelpers";

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
  const asset = await assetStore.getAsset(assetId);
  const assetName = await assetStore.getAssetTitle(assetId);

  invariant(asset, `Asset with id ${assetId} not found`);

  // Read the instanceNav cache imperatively: analytics fires from store
  // actions, where vue-query composables are unavailable, and only
  // needs a point-in-time snapshot.
  const instanceNav = appQueryClient.getQueryData<ApiInstanceNavResponse>([
    INSTANCENAV_QUERY_KEY,
  ]);
  const collectionIndex = toCollectionIndex(
    normalizeAssetCollections(instanceNav?.collections ?? [])
  );
  const collection = collectionIndex[asset.collectionId] ?? null;

  return {
    asset_id: assetId,
    asset_name: assetName ?? "Unknown",
    collection_id: asset.collectionId,
    collection_name: collection?.title ?? "Unknown",
    instance_id: instanceNav?.instanceId ?? -1,
    instance_name: instanceNav?.instanceName ?? "Unknown",
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
