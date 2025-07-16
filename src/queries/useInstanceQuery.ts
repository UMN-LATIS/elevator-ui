import { useQuery } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { INSTANCE_QUERY_KEY } from "./queryKeys";

export function useInstanceQuery(options = {}) {
  return useQuery({
    queryKey: [INSTANCE_QUERY_KEY],
    initialData: () => null,
    queryFn: fetchers.fetchInstanceNav,
    refetchOnWindowFocus: true,
    ...options,
  });
}
