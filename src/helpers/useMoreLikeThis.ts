import api from "./api";
import { ref, Ref, watch } from "vue";
import { SearchResultMatch } from "@/types";

export function useMoreLikeThis(assetIdRef: Ref<string | null>) {
  const matches = ref<SearchResultMatch[]>([]);

  watch(
    assetIdRef,
    async () => {
      matches.value = await api.getMoreLikeThis(assetIdRef.value);
    },
    { immediate: true }
  );

  return { matches };
}
