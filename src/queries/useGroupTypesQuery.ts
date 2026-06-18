import { useQuery } from "@tanstack/vue-query";
import { fetchGroupTypes } from "@/api/fetchers";

export function useGroupTypesQuery(options = {}) {
  return useQuery({
    queryKey: ["GROUP_TYPES"],
    queryFn: fetchGroupTypes,
    // Group types essentially never change, so treat the data as
    // permanently fresh — fetch once, then reuse for the page's life.
    staleTime: Infinity,
    ...options,
  });
}
