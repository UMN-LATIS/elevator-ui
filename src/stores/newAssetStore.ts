import axios from "axios";
import { Asset } from "@/types";
import { defineStore } from "pinia";
import handleAxiosError from "@/utils/handleAxiosError";
import config from "@/config";

export interface AssetStoreState {
  assets: Map<string, Asset>;
  activeAssetId: string | null;
  activeObjectId: string | null;
  activeFileObjectId: string | null;
}

export const useAssetStore = defineStore("asset2", {
  state: (): AssetStoreState => ({
    assets: new Map<string, Asset>(),
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
    async setActiveAsset(assetId: string): Promise<Asset | null> {
      const activeAsset = await this.fetchAsset(assetId);

      // if no asset with this id, reset active asset id,
      // active object id, and active file id to null
      if (!activeAsset) {
        this.resetActiveAsset();
        return null;
      }

      // set the active asset
      this.activeAssetId = assetId;

      // also set the first object within the asset
      // as active if the `firstObjectId` prop exists
      // and if it doesn't, reset the activeObjectId and
      // activeFileId to null
      if (activeAsset.firstObjectId) {
        await this.setActiveObject(activeAsset.firstObjectId);
      } else {
        this.resetActiveObject();
      }

      return activeAsset;
    },

    /**
     * An Asset contains objects. This makes makes an object
     * in a given asset active
     *
     * @returns the active object
     */
    async setActiveObject(objectId: string): Promise<Asset | null> {
      const activeObject = await this.fetchAsset(objectId);

      // if no object with this ID, reset the active
      // objectid and file object id to null
      if (!activeObject) {
        this.resetActiveObject();
        return null;
      }

      // otherwise, make the objectId active
      this.activeObjectId = objectId;

      // and, if it exists, make the first (and only?)
      // filehandler in this object active
      this.activeFileObjectId = activeObject.firstFileHandlerId ?? null;

      return activeObject;
    },

    /**
     * gets an asset from the store or retrieves it from the api
     */
    async fetchAsset(assetId: string): Promise<Asset | null> {
      if (this.assets.has(assetId)) {
        return this.assets.get(assetId) as Asset;
      }

      try {
        const res = await axios.get<Asset>(
          `${config.baseUrl}/asset/viewAsset/${assetId}/true`
        );
        this.assets.set(assetId, res.data);
        return res.data;
      } catch (err) {
        handleAxiosError(err);
        return null;
      }
    },

    resetActiveAsset() {
      this.activeAssetId = null;
      this.resetActiveObject();
    },

    resetActiveObject() {
      this.activeObjectId = null;
      this.activeFileObjectId = null;
    },
  },
});
