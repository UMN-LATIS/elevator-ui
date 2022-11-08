import { Asset, Template } from "@/types";
import { Ref, ref, watch, computed } from "vue";
import api from "./api";
import { getAssetTitle } from "./displayUtils";

export function useAsset(assetIdRef: Ref<string | null>) {
  const assetRef = ref<Asset | null>(null);
  const templateRef = ref<Template | null>(null);
  const title = computed((): string =>
    assetRef.value ? getAssetTitle(assetRef.value) : ""
  );

  async function onAssetIdChange() {
    const { asset, template } = await api.getAssetWithTemplate(
      assetIdRef.value
    );
    assetRef.value = asset;
    templateRef.value = template;
  }

  watch(assetIdRef, onAssetIdChange, { immediate: true });

  return { asset: assetRef, template: templateRef, title };
}
