import { Asset } from "@/types";
import { defineStore } from "pinia";
import api from "@/api";
import { getAssetTitle } from "@/helpers/displayUtils";
import { useAnalytics } from "@/helpers/useAnalytics";
import invariant from "tiny-invariant";

export interface AssetStoreState {
  activeAssetId: string | null;
  activeObjectId: string | null;
  activeFileObjectId: string | null; // fileHandlerId
}

export const useAssetStore = defineStore("asset2", {
  state: (): AssetStoreState => ({
    activeAssetId: null,
    activeObjectId: null,
    activeFileObjectId: null,
  }),
  actions: {
    /**
     * This makes a given asset active and sets the
     * active object with the firstObjectId
     * @returns active
     */
    async setActiveAsset(
      assetId: string | null,
      objectId?: string | null
    ): Promise<Asset | null> {
      const { asset } = await api.getAssetWithTemplate(assetId);

      if (!asset) {
        this.activeAssetId = null;
        this.activeObjectId = null;
        this.activeFileObjectId = null;
        return null;
      }

      this.activeAssetId = assetId;
      invariant(assetId, "asset id should be defined");

      // track this asset view
      const { trackEvent } = useAnalytics();
      trackEvent("asset_view", {
        // QUESTION
        // there's a cap on number of custom dimensions. Should we use built in dimensions like `contet_group` instead?
        // see: https://support.google.com/analytics/table/13948007?visit_id=638761100108506149-1634441230&rd=2
        key_event: true,
        collection_id: asset.collectionId,
        collection_name: asset.collectionName,
        asset_title: getAssetTitle(asset),
        asset_id: assetId,
      });

      // if an objectId is provided, use it to set
      // the active object
      if (objectId) {
        return this.setActiveObject(objectId);
      }

      // if no objectId is provided, use the asset's
      // firstObjectId and firstFileHandler
      this.activeObjectId = asset?.firstObjectId ?? null;
      this.activeFileObjectId = asset?.firstFileHandlerId ?? null;
      return asset;
    },

    /**
     * An Asset contains objects. This makes makes an object
     * in a given asset active
     *
     * @returns the active object
     */
    async setActiveObject(objectId: string | null): Promise<Asset | null> {
      const { asset } = await api.getAssetWithTemplate(objectId);

      // if asset exists, set the objectId to active, otherwise null
      this.activeObjectId = asset ? objectId : null;
      this.activeFileObjectId = asset?.firstFileHandlerId ?? null;

      return asset;
    },

    async getAsset(assetId: string): Promise<Asset | null> {
      const { asset } = await api.getAssetWithTemplate(assetId);

      return asset;
    },

    async getAssetTitle(assetId: string): Promise<string | null> {
      const asset = await this.getAsset(assetId);
      if (!asset) return null;
      return getAssetTitle(asset);
    },
  },
});
