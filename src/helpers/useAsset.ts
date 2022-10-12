import { Asset, Template } from "@/types";
import { Ref, ref, watch } from "vue";
import api from "./api";

export function useAsset(assetIdRef: Ref<string | null>) {
  const assetRef = ref<Asset | null>(null);
  const templateRef = ref<Template | null>(null);

  watch(
    assetIdRef,
    async () => {
      const { asset, template } = await api.getAssetWithTemplate(
        assetIdRef.value
      );
      assetRef.value = asset;
      templateRef.value = template;
    },
    { immediate: true }
  );

  return { asset: assetRef, template: templateRef };
}
