import {
  Asset,
  Template,
  WIDGET_TYPES,
  type UploadWidgetDef,
  type UploadWidgetContent,
} from "@/types";
import { defineStore } from "pinia";
import api from "@/api";
import { getAssetTitle } from "@/helpers/displayUtils";
import { useAnalytics } from "@/helpers/useAnalytics";

export interface AssetStoreState {
  activeAssetId: string | null;
  activeObjectId: string | null;
  activeFileObjectId: string | null; // fileHandlerId
  activeAsset: Asset | null;
  activeTemplate: Template | null;
}

export const useAssetStore = defineStore("asset2", {
  state: (): AssetStoreState => ({
    activeAssetId: null,
    activeObjectId: null,
    activeFileObjectId: null,
    activeAsset: null,
    activeTemplate: null,
  }),
  getters: {
    activeFileDescription(): string {
      if (!this.activeAsset || !this.activeTemplate) return "";

      const uploadWidgetDef = this.activeTemplate.widgetArray.find(
        (w): w is UploadWidgetDef => w.type === WIDGET_TYPES.UPLOAD
      );
      if (!uploadWidgetDef) return "";

      const contents = this.activeAsset[uploadWidgetDef.fieldTitle] as
        | UploadWidgetContent[]
        | undefined;

      const activeContent = contents?.find(
        (c) => c.fileId === this.activeFileObjectId
      );

      return activeContent?.fileDescription ?? "";
    },
    activeTitle(): string {
      if (!this.activeAsset) return "";
      return getAssetTitle(this.activeAsset);
    },
  },
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
      const parentAssetId = this.activeAssetId || "";
      const { asset, template } = await api.getAssetWithTemplate(
        assetId,
        parentAssetId
      );

      if (!asset || !assetId) {
        this.activeAssetId = null;
        this.activeObjectId = null;
        this.activeFileObjectId = null;
        this.activeAsset = null;
        this.activeTemplate = null;
        return null;
      }

      this.activeAssetId = assetId;
      this.activeAsset = asset;
      this.activeTemplate = template;

      useAnalytics().trackViewAssetEvent(assetId);

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
      const parentAssetId = this.activeAssetId || "";
      const { asset, template } = await api.getAssetWithTemplate(
        objectId,
        parentAssetId
      );

      // if asset exists, set the objectId to active, otherwise null
      this.activeObjectId = asset ? objectId : null;
      this.activeFileObjectId = asset?.firstFileHandlerId ?? null;
      this.activeAsset = asset ?? this.activeAsset;
      this.activeTemplate = template ?? this.activeTemplate;

      return asset;
    },

    // parentAssetId is needed to properly resolve permissions for related assets
    async getAsset(assetId: string): Promise<Asset | null> {
      const parentAssetId = this.activeAssetId || "";
      const { asset } = await api.getAssetWithTemplate(assetId, parentAssetId);

      return asset;
    },

    async getAssetTitle(assetId: string): Promise<string | null> {
      const asset = await this.getAsset(assetId);
      if (!asset) return null;
      return getAssetTitle(asset);
    },
  },
});
