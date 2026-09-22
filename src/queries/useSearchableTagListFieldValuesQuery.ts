import { useQuery } from "@tanstack/vue-query";
import { MaybeRefOrGetter, computed, toValue } from "vue";
import api from "@/api";
import { SearchableTagListField } from "@/types";

export function useSearchableTagListFieldValuesQuery(
  field: MaybeRefOrGetter<SearchableTagListField>
) {
  return useQuery({
    queryKey: computed(() => [
      "searchableTagListFieldValues",
      toValue(field).id,
      toValue(field).template,
    ]),
    queryFn: () => api.getSearchableTagListFieldValues(toValue(field)),
  });
}
