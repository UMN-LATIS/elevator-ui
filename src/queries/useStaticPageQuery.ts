import { useQuery } from "@tanstack/vue-query";
import { MaybeRefOrGetter, toValue } from "vue";
import api from "@/api";

export function useStaticPageQuery(
  pageIdRef: MaybeRefOrGetter<number | null>,
  options = {}
) {
  return useQuery({
    queryKey: ["staticPage", pageIdRef],
    queryFn: ({ signal }) => {
      const pageId = toValue(pageIdRef);
      return pageId ? api.getStaticPage(pageId, { signal }) : null;
    },
    ...options,
  });
}
