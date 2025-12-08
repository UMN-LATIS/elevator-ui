import { useQuery } from "@tanstack/vue-query";
import { MaybeRefOrGetter, toValue } from "vue";
import api from "@/api";

export function useStaticPageQuery(
  pageIdRef: MaybeRefOrGetter<number>,
  options = {}
) {
  return useQuery({
    queryKey: ["staticPage", pageIdRef],
    queryFn: ({ signal }) => api.getStaticPage(toValue(pageIdRef), { signal }),
    ...options,
  });
}
