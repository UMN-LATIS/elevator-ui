import { useQuery } from "@tanstack/vue-query";
import { MaybeRefOrGetter, computed, toValue } from "vue";
import axios from "axios";
import config from "@/config";

const BASE_URL = config.instance.base.url;

export function useAutocompleteQuery(
  fieldTitle: MaybeRefOrGetter<string>,
  searchTerm: MaybeRefOrGetter<string>,
  templateId?: MaybeRefOrGetter<string | number>
) {
  return useQuery({
    queryKey: computed(() => [
      "textAutocomplete",
      toValue(fieldTitle),
      toValue(searchTerm),
      toValue(templateId),
    ]),
    initialData: () => [] as string[],
    queryFn: async () => {
      const term = toValue(searchTerm);
      if (!term || term.length < 1) {
        return [];
      }

      const formData = new FormData();
      formData.append("templateId", String(toValue(templateId) || ""));
      formData.append("fieldTitle", toValue(fieldTitle));
      formData.append("searchTerm", term);

      const response = await axios.post<string[]>(
        `${BASE_URL}/search/autocomplete`,
        formData
      );
      return response.data;
    },
    enabled: computed(() => {
      const term = toValue(searchTerm);
      return Boolean(term && term.length >= 1);
    }),
  });
}
