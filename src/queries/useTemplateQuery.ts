import { useQuery } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { toValue, type MaybeRefOrGetter } from "vue";
import { TEMPLATES_QUERY_KEY } from "./queryKeys";
import type { Template } from "@/types";

export function useTemplateQuery(
  templateId: MaybeRefOrGetter<string | number | null>,
  options = {}
) {
  return useQuery({
    // use reactive query keys to avoid stale data
    queryKey: [TEMPLATES_QUERY_KEY, templateId],
    enabled: () => !!toValue(templateId),
    initialData: () => null,
    queryFn: async () => {
      console.log("running template query");
      const id = toValue(templateId);
      const idInt = Number.parseInt(id as string);
      return id ? await fetchers.fetchTemplate(idInt) : null;
    },
    refetchOnWindowFocus: false,
    ...options,
  });
}
