import { useQuery } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { toValue, type MaybeRefOrGetter } from "vue";
import { TEMPLATES_QUERY_KEY } from "./queryKeys";
import type { Template } from "@/types";

export function useTemplateQuery(
  templateId: MaybeRefOrGetter<Template["templateId"] | null>,
  options = {}
) {
  return useQuery({
    // use reactive query keys to avoid stale data
    queryKey: [TEMPLATES_QUERY_KEY, templateId],
    enabled: () => !!toValue(templateId),
    initialData: () => null,
    queryFn: async () => {
      const id = toValue(templateId);
      return id ? await fetchers.fetchTemplate(id) : null;
    },
    refetchOnWindowFocus: false,
    ...options,
  });
}
