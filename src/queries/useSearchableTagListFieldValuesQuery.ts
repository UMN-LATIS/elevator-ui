import { useQuery } from "@tanstack/vue-query";
import { MaybeRefOrGetter, toValue } from "vue";
import api from "@/api";
import { SearchableTagListField } from "@/types";

export function useSearchableTagListFieldValuesQuery(
  field: MaybeRefOrGetter<SearchableTagListField>
) {
  return useQuery({
    queryKey: [
      "searchableTagListFieldValues",
      () => toValue(field).id,
      () => toValue(field).template,
    ],
    queryFn: () => api.getSearchableTagListFieldValues(toValue(field)),
  });
}
