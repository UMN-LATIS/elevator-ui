import { PAGE_ASSET_ID } from "@/constants/constants";
import { Asset } from "@/types";
import { computed, inject, MaybeRefOrGetter, toValue } from "vue";
import { provide } from "vue";

export const usePageAssetIdProvider = (
  maybeAssetId: MaybeRefOrGetter<Asset["assetId"] | null>
) => {
  const assetId = computed(() => toValue(maybeAssetId));
  provide(PAGE_ASSET_ID, assetId);
};

export const usePageAssetId = () => {
  return inject(PAGE_ASSET_ID);
};
