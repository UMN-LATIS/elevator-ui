import { defineStore } from "pinia";

export const useAssetStore = defineStore("asset", {
  state: () => {
    return {
      objectId: null as string | null,
      fileObjectId: null as string | null,
    };
  },
});
