import { useQuery } from "@tanstack/vue-query";
import { fetchAllUserAssets } from "@/api/fetchers";
import { Asset } from "@/types";

export function useAllUserAssets() {
  return useQuery({
    queryKey: ["assets"],
    queryFn: fetchAllUserAssets,
    initialData: () => [] as Asset[],
  });
}
