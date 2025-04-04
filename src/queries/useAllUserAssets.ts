import { useQuery } from "@tanstack/vue-query";
import { fetchAllUserAssets } from "@/api/fetchers";

export function useAllUserAssets() {
  return useQuery({
    queryKey: ["assets"],
    queryFn: fetchAllUserAssets,
  });
}
