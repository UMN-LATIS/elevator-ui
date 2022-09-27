import axios from "axios";
import { Asset, Template } from "@/types";
import { defineStore } from "pinia";
import config from "@/config";

export interface AssetStoreState {
  assets: Map<string, Asset>;
  templates: Map<string, Template>;
  activeAssetId: string | null;
  activeObjectId: string | null;
  activeFileObjectId: string | null;
}

export const useAssetStore = defineStore("asset2", {
  state: (): AssetStoreState => ({
    assets: new Map<string, Asset>(),
    templates: new Map<string, Template>(),
    activeAssetId: null,
    activeObjectId: null,
    activeFileObjectId: null,
  }),
  actions: {
    async fetchAsset(assetId: string): Promise<Asset | null> {
      if (this.assets.has(assetId)) {
        return this.assets.get(assetId) as Asset | null;
      }

      const res = await axios.get<Asset>(
        `${config.baseUrl}/asset/viewAsset/${assetId}/true`
      );

      const asset = res.data ?? null;

      this.assets.set(assetId, asset);
      return asset;
    },

    async fetchTemplate(templateId: string): Promise<Template | null> {
      if (this.templates.has(templateId)) {
        return this.templates.get(templateId) as Template | null;
      }

      const res = await axios.get<Template>(
        `${config.baseUrl}/assetManager/getTemplate/${templateId}`
      );

      const template = res.data ?? null;
      this.templates.set(templateId, template);
      return template;
    },

    /**
     * gets the asset with the corresponding template
     */
    async getAssetWithTemplate(assetId: string) {
      const asset =
        this.assets.get(assetId) || (await this.fetchAsset(assetId));

      if (!asset || !asset?.templateId) {
        console.error(
          `Cannot load asset ${assetId} with template. No templateId.`
        );
        return { asset: null, template: null };
      }

      // load the template
      const template =
        this.templates.get(String(asset.templateId)) ||
        (await this.fetchTemplate(String(asset.templateId)));

      // return the asset and template
      return { asset, template };
    },

    /**
     * This makes a given asset active and sets the
     * active object with the firstObjectId
     * @returns active
     */
    async setActiveAsset(
      assetId: string,
      objectId?: string
    ): Promise<Asset | null> {
      // make sure the asset and its template are in the store
      const { asset } = await this.getAssetWithTemplate(assetId);

      // set the active asset
      this.activeAssetId = asset ? assetId : null;

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
    async setActiveObject(objectId: string): Promise<Asset | null> {
      const { asset } = await this.getAssetWithTemplate(objectId);

      // if asset exists, set the objectId to active, otherwise null
      this.activeObjectId = asset ? objectId : null;
      this.activeFileObjectId = asset?.firstFileHandlerId ?? null;

      return asset;
    },
  },
});
