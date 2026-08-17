import { useQuery } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { INSTANCENAV_QUERY_KEY } from "./queryKeys";

export function useInstanceNavQuery(options = {}) {
  return useQuery({
    queryKey: [INSTANCENAV_QUERY_KEY],
    queryFn: fetchers.fetchInstanceNav,
    refetchOnWindowFocus: true,
    ...options,
  });
}
