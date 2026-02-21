import { useQuery } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { toValue, type MaybeRefOrGetter } from "vue";
import { DRAWERS_QUERY_KEY } from "./queryKeys";

export function useDrawerQuery(
  drawerId: MaybeRefOrGetter<number>,
  options = {}
) {
  return useQuery({
    queryKey: [DRAWERS_QUERY_KEY, drawerId],
    enabled: toValue(drawerId) !== null,
    queryFn: async () => {
      const id = toValue(drawerId);
      return id !== null ? await fetchers.fetchDrawer(id) : null;
    },
    refetchOnWindowFocus: false,
    ...options,
  });
}
