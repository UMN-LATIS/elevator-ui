import axios from "axios";
import { Asset } from "@/types";
import { defineStore } from "pinia";
import handleAxiosError from "@/utils/handleAxiosError";
import config from "@/config";

export const useAssetStore = defineStore("asset2", {
  state: () => ({
    assets: new Map<string, Asset>(),
  }),
  actions: {
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
  },
});
