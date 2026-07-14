import { useQuery } from "@tanstack/vue-query";
import { MaybeRefOrGetter, computed, toValue } from "vue";
import {
  fetchDrawerUserAutocomplete,
  fetchUserAutocomplete,
} from "@/api/fetchers";
import { UserAutocompleteMatch } from "@/types";
import {
  DRAWER_USER_AUTOCOMPLETE_QUERY_KEY,
  USER_AUTOCOMPLETE_QUERY_KEY,
} from "./queryKeys";

// Reactive user-search for a group's member field. Only fires at 2+ chars
// to avoid a directory lookup on every keystroke.
export function useUserAutocompleteQuery(searchTerm: MaybeRefOrGetter<string>) {
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

// The drawer-manager twin of useUserAutocompleteQuery, backed by the
// drawerPermissions endpoint a non-admin drawer manager may call.
export function useDrawerUserAutocompleteQuery(
  searchTerm: MaybeRefOrGetter<string>
) {
  return useQuery({
    queryKey: computed(() => [
      DRAWER_USER_AUTOCOMPLETE_QUERY_KEY,
      toValue(searchTerm),
    ]),
    placeholderData: () => [] as UserAutocompleteMatch[],
    queryFn: ({ signal }) =>
      fetchDrawerUserAutocomplete(toValue(searchTerm), { signal }),
    enabled: computed(() => toValue(searchTerm).trim().length >= 2),
  });
}
