import { useQuery } from "@tanstack/vue-query";
import { MaybeRefOrGetter, computed, toValue } from "vue";
import { fetchUserAutocomplete } from "@/api/fetchers";
import { UserAutocompleteMatch } from "@/types";
import { USER_AUTOCOMPLETE_QUERY_KEY } from "./queryKeys";

// Reactive user-search for a group's member field. Only fires at 2+ chars
// to avoid a directory lookup on every keystroke.
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
