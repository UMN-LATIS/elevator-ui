import { useQuery } from "@tanstack/vue-query";
import { MaybeRefOrGetter, computed, toValue } from "vue";
import { fetchUserAutocomplete } from "@/api/fetchers";
import { UserAutocompleteMatch } from "@/types";
import { USER_AUTOCOMPLETE_QUERY_KEY } from "./queryKeys";

// Suggest people for a "Specific People" group member field. Reactive on
// the search term; only fires at 2+ chars to mirror the backend's
// short-circuit and to spare API-school directory lookups per keystroke.
export function useUserAutocompleteQuery(
  searchTerm: MaybeRefOrGetter<string>
) {
  return useQuery({
    queryKey: computed(() => [
      USER_AUTOCOMPLETE_QUERY_KEY,
      toValue(searchTerm),
    ]),
    placeholderData: () => [] as UserAutocompleteMatch[],
    queryFn: ({ signal }) =>
      fetchUserAutocomplete(toValue(searchTerm), { signal }),
    enabled: computed(() => toValue(searchTerm).trim().length >= 2),
  });
}
