import { PAGE_ASSET } from "@/constants/constants";
import { Asset } from "@/types";
import {
  computed,
  inject,
  provide,
  ref,
  toValue,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";

/** The asset a page is showing, shared with the menu rendered inside it. */
export interface PageAsset {
  assetId: ComputedRef<Asset["assetId"] | null>;
  /** Set by whoever deletes the asset, so the page can stop guarding it. */
  isAssetDeleted: Ref<boolean>;
}

export const usePageAssetProvider = (
  maybeAssetId: MaybeRefOrGetter<Asset["assetId"] | null>
): PageAsset => {
  const assetId = computed(() => toValue(maybeAssetId));
  const isAssetDeleted = ref(false);

  // the flag describes the asset the page is on now, so a different asset
  // starts undeleted
  watch(assetId, () => {
    isAssetDeleted.value = false;
  });

  const pageAsset: PageAsset = { assetId, isAssetDeleted };
  provide(PAGE_ASSET, pageAsset);

  return pageAsset;
};

export const usePageAsset = (): PageAsset | null => inject(PAGE_ASSET, null);
