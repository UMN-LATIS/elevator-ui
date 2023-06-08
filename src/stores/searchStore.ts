import { defineStore } from "pinia";
import api from "@/api";
import { ref, reactive, computed, type Ref } from "vue";
import {
  FetchStatus,
  SearchResultMatch,
  SearchEntry,
  SearchResultsView,
  SearchSortOptions,
  SearchableSpecificFieldFilter,
  SearchRequestOptions,
  SpecificFieldSearchItem,
  WidgetType,
} from "@/types";
import { SORT_KEYS } from "@/constants/constants";
import { useInstanceStore } from "./instanceStore";

export interface SearchStoreState {
  searchId: Ref<string | undefined>;
  status: Ref<FetchStatus>;

  // query is the current state of the search text input
  // use searchEntry.searchText to get the search text
  // submitted in the previous search
  query: Ref<string>;

  // filterBy is the current state of the filters
  // use searchEntry.collection to get the list of
  // collections that were used in the previous search
  filterBy: {
    collectionIds: number[];
    specificFieldsMap: Map<string, SearchableSpecificFieldFilter>;
    searchableFieldsOperator: "AND" | "OR";
    dateRange: null | {
      startDate: string;
      endDate: string;
    };
  };

  matches: Ref<SearchResultMatch[]>;
  totalResults: Ref<number | undefined>;
  currentPage: Ref<number>;

  // use searchEntry when we need to determine the state
  // of the search we're currently viewing.
  searchEntry: Ref<SearchEntry | null>;
  resultsView: Ref<SearchResultsView>;
  sortOptions: Ref<SearchSortOptions>;
  sort: Ref<keyof SearchSortOptions>;
  beforeNewSearchHandlers: (() => void)[];
  afterNewSearchHandlers: ((state: SearchStoreState) => void)[];
}

const defaultSortOptions: SearchSortOptions = {
  [SORT_KEYS.BEST_MATCH]: "Best Match",
  [SORT_KEYS.TITLE]: "Default Title",
  [SORT_KEYS.LAST_MODIFIED_ASC]: "Modified Date (oldest to newest)",
  [SORT_KEYS.LAST_MODIFIED_DESC]: "Modified Date (newest to oldest)",
};

const createState = (): SearchStoreState => ({
  searchId: ref(undefined),
  status: ref("idle"),
  query: ref(""),
  filterBy: reactive({
    collectionIds: [],
    specificFieldsMap: new Map<string, SearchableSpecificFieldFilter>(),
    searchableFieldsOperator: "AND",
    dateRange: null,
  }),
  matches: ref([]),
  totalResults: ref(undefined),
  currentPage: ref(0),
  searchEntry: ref(null),
  resultsView: ref("grid"),
  sortOptions: ref(defaultSortOptions),
  sort: ref(SORT_KEYS.BEST_MATCH),
  beforeNewSearchHandlers: [],
  afterNewSearchHandlers: [],
});

const getters = (state: SearchStoreState) => ({
  isReady: computed(() => state.status.value === "success"),

  hasMoreResults: computed(() => {
    return state.matches.value.length < (state.totalResults.value ?? 0);
  }),

  hasDateRangeFilter: computed(() => {
    return state.filterBy.dateRange !== null;
  }),

  filteredByCount: computed((): number => {
    return (
      state.filterBy.collectionIds.length +
      state.filterBy.specificFieldsMap.size +
      (getters(state).hasDateRangeFilter.value ? 1 : 0)
    );
  }),

  hasFieldFiltersApplied: computed((): boolean => {
    return (
      state.filterBy.specificFieldsMap.size > 0 ||
      getters(state).hasDateRangeFilter.value
    );
  }),

  hasFiltersApplied: computed((): boolean => {
    return getters(state).filteredByCount.value > 0;
  }),

  searchRequestOptions: computed((): SearchRequestOptions => {
    const searchableFieldsArray = Array.from(
      state.filterBy.specificFieldsMap.values()
    );

    // convert to SpecificFieldSearch shape
    const specificFieldSearch: SpecificFieldSearchItem[] =
      searchableFieldsArray.map((filter) => ({
        field: filter.fieldId,
        text: filter.value,
        fuzzy: filter.isFuzzy,
      }));

    return {
      sort: state.sort.value,
      collection: state.filterBy.collectionIds.length
        ? state.filterBy.collectionIds
        : undefined,
      combineSpecificSearches: state.filterBy.searchableFieldsOperator,
      specificFieldSearch,
    };
  }),

  specificFieldFilters: computed((): SearchableSpecificFieldFilter[] => {
    return Array.from(state.filterBy.specificFieldsMap.values());
  }),

  /**
   * if the current search results are for a single collection
   * with no search text, then we are browsing that collection
   */
  isBrowsingCollection: computed((): boolean => {
    return (
      state.searchEntry.value?.searchText === "" &&
      state.searchEntry.value?.collection?.length === 1 &&
      // if we're filtering by specific fields, we're not browsing
      (state.searchEntry.value?.specificFieldSearch ?? []).length === 0
    );
  }),
  browsingCollectionId: computed((): number | null => {
    if (!getters(state).isBrowsingCollection.value) {
      return null;
    }

    const firstCollectionId: string | undefined =
      state.searchEntry.value?.collection?.[0];

    return firstCollectionId ? Number.parseInt(firstCollectionId) : null;
  }),

  supportedSpecificFieldTypes: computed((): WidgetType[] => [
    "text",
    "select",
    "checkbox",
    "date",
    "tag list",
    "text area",
    "multiselect",
  ]),
});

const actions = (state: SearchStoreState) => ({
  async setSortOption(option: keyof SearchSortOptions) {
    state.sort.value = option;

    // refresh search results
    return this.search();
  },

  addCollectionIdFilter(collectionId: number) {
    state.filterBy.collectionIds.push(collectionId);
  },

  removeCollectionIdFilter(collectionId: number) {
    const index = state.filterBy.collectionIds.indexOf(collectionId);

    if (index < 0) {
      throw new Error(
        `Cannot remove collection id ${collectionId} from searchStore. ID is not in filterBy.collectionIds`
      );
    }

    state.filterBy.collectionIds.splice(index, 1);
  },

  clearCollectionIdFilters() {
    state.filterBy.collectionIds = [];
  },

  addDateRangeFilter() {
    state.filterBy.dateRange = {
      startDate: "",
      endDate: "",
    };
  },

  getSearchableFieldFilter(
    filterId: string
  ): SearchableSpecificFieldFilter | null {
    return state.filterBy.specificFieldsMap.get(filterId) ?? null;
  },

  updateSearchableFieldFilter(
    filterId: string,
    updatedFilterProps: Partial<SearchableSpecificFieldFilter>
  ) {
    const currentFilter = this.getSearchableFieldFilter(filterId);

    if (!currentFilter) {
      throw new Error(
        `cannot update filter with id ${filterId}. No such filter exists.`
      );
    }

    if (updatedFilterProps.id) {
      throw new Error(
        `cannot update filter with id ${filterId}. Cannot update the id of a filter.`
      );
    }

    state.filterBy.specificFieldsMap.set(filterId, {
      ...currentFilter,
      ...updatedFilterProps,
    });
  },

  async addSearchableFieldFilter(
    fieldId: string,
    initialProps?: Partial<SearchableSpecificFieldFilter>
  ) {
    const instanceStore = useInstanceStore();
    const field = instanceStore.getSearchableField(fieldId);

    if (!field) {
      throw new Error(
        `Cannot add searchable field filter for field ${fieldId}: no such field exists`
      );
    }

    const newFilter: SearchableSpecificFieldFilter = {
      fieldId,
      value: "",
      isFuzzy: false,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...initialProps,
    };

    if (field.type === "checkbox") {
      newFilter.value = "boolean_true";
    }

    state.filterBy.specificFieldsMap.set(newFilter.id, newFilter);
  },

  removeSearchableFieldFilter(filterId: string) {
    state.filterBy.specificFieldsMap.delete(filterId);
  },

  updateSearchableFieldFilterValue(filterId: string, newValue: string) {
    const filter = state.filterBy.specificFieldsMap.get(filterId);
    if (!filter) {
      throw new Error(
        `Cannot update value of searchable field filter ${filterId}: no such filter found`
      );
    }

    filter.value = newValue;
  },

  clearSearchableFieldsFilters() {
    state.filterBy.specificFieldsMap.clear();
    state.filterBy.searchableFieldsOperator = "AND";
    state.filterBy.dateRange = null;
  },

  updateFilterFieldId(filterId: string, fieldId: string) {
    const instanceStore = useInstanceStore();

    const currentFilter = state.filterBy.specificFieldsMap.get(filterId);

    if (!currentFilter) {
      throw new Error(
        `Cannot update searchable field filter. No filter exists with id: ${filterId}`
      );
    }

    // if the fieldId matches what's set in the current
    // filter, we're done
    if (currentFilter.fieldId === fieldId) {
      return;
    }

    // get the field information from the instance store
    const field = instanceStore.getSearchableField(fieldId);

    if (!field) {
      throw new Error(
        `Cannot update searchable field filter. No field is found with id ${fieldId}.`
      );
    }

    const updatedFilter = {
      ...currentFilter,
      fieldId: field.id,
    };

    state.filterBy.specificFieldsMap.set(filterId, updatedFilter);
  },

  updateSearchableFieldsOperator(operator: string) {
    const allowedOperators = ["AND", "OR"];
    if (!allowedOperators.includes(operator)) {
      throw new Error(
        `Cannot update searchable fields operator. ${operator} is not in ${allowedOperators.join(
          ", "
        )}`
      );
    }

    state.filterBy.searchableFieldsOperator = operator as "AND" | "OR";
  },

  updateSearchableFieldFilterIsFuzzy(filterId: string, isFuzzy: boolean) {
    const filter = state.filterBy.specificFieldsMap.get(filterId);
    if (!filter) {
      throw new Error(
        `Cannot update isFuzzy of searchable field filter ${filterId}: no such filter found`
      );
    }

    filter.isFuzzy = isFuzzy;
  },

  clearAllFilters() {
    this.clearCollectionIdFilters();
    this.clearSearchableFieldsFilters();
    state.filterBy.searchableFieldsOperator = "AND";
  },

  async search(searchId?: string): Promise<string | void> {
    // call all registered before handlers
    state.beforeNewSearchHandlers.forEach((fn) => fn());

    // clear old search results
    state.status.value = "fetching";
    state.searchId.value = undefined;
    state.matches.value = [];
    state.totalResults.value = undefined;
    state.currentPage.value = 0;
    state.searchEntry.value = null;

    try {
      // first get the id of the search for this query
      // if it's passed, use that
      state.searchId.value = searchId
        ? searchId
        : await api
            .getSearchId(
              state.query.value,
              getters(state).searchRequestOptions.value
            )
            .catch((err) => {
              state.status.value = "error";
              throw new Error(
                `Cannot getSearchId for query: ${state.query}: ${err}`
              );
            });

      // async (don't await) get search results and update store
      // so that we can return the search id so they can redirect
      // if needed
      api
        .getSearchResultsById(state.searchId.value)
        .then((res) => {
          state.searchEntry.value = res.searchEntry;
          state.totalResults.value = res.totalResults;
          state.matches.value = res.matches;
          state.status.value = "success";
          state.sortOptions.value = res.sortableWidgets;

          // update the boolean operator
          state.filterBy.searchableFieldsOperator =
            res.searchEntry.combineSpecificSearches;

          // set the collections list to the collections in the search entry
          state.filterBy.collectionIds =
            res.searchEntry.collection?.map((idStr) =>
              Number.parseInt(idStr)
            ) ?? [];

          // Update searchableFields with response
          if (res.searchEntry.specificFieldSearch) {
            state.filterBy.specificFieldsMap.clear();

            res.searchEntry.specificFieldSearch?.forEach((searchField) => {
              actions(state).addSearchableFieldFilter(searchField.field, {
                value: searchField.text,
                isFuzzy: searchField.fuzzy,
              });
            });
          }

          // set query to the search text if it's not already set
          // to something. This handles the case when a user enters
          // the search results page with a search id in the url, but
          // nothing yet in the search input box
          state.query.value =
            state.query.value || res.searchEntry?.searchText || "";

          // call all registered after handlers
          state.afterNewSearchHandlers.forEach((fn) => fn(state));
        })
        .catch((err) => {
          state.status.value = "error";
          throw new Error(
            `Cannot getSearchResultsById for search id: ${JSON.stringify(
              state.searchId
            )}: ${err}`
          );
        });
    } catch (error) {
      console.error(error);
      state.status.value = "error";

      // call all registered after handlers even if error
      state.afterNewSearchHandlers.forEach((fn) => fn(state));
    }

    return state.searchId.value;
  },

  // register a callback to be called when a new search is started
  onBeforeNewSearch(fn: () => void) {
    state.beforeNewSearchHandlers.push(fn);
  },

  // register a callback to be called when a new search is completed
  onAfterNewSearch(fn: (state: SearchStoreState) => void) {
    state.afterNewSearchHandlers.push(fn);
  },

  async loadMore({ loadAll } = { loadAll: false }) {
    if (!state.searchId.value) {
      throw new Error("No search id found. Cannot load more.");
    }

    if (!getters(state).hasMoreResults.value) {
      console.log("cannot load more results, already at the end");
      return;
    }

    state.status.value = "fetching";
    const prevPage = state.currentPage.value;
    try {
      state.currentPage.value = prevPage + 1;
      const res = await api.getSearchResultsById(
        state.searchId.value,
        state.currentPage.value,
        loadAll
      );
      state.matches.value.push(...res.matches);
      state.searchEntry.value = res.searchEntry;
      state.status.value = "success";
    } catch (error) {
      state.status.value = "error";
      // rollback page if error
      state.currentPage.value = prevPage;
      console.error(error);
    }
  },
  setResultsView(view: SearchResultsView) {
    state.resultsView.value = view;
  },
});

export const useSearchStore = defineStore("search", () => {
  const state = createState();
  const storeGetters = getters(state);
  const storeActions = actions(state);

  return {
    ...storeGetters,
    ...storeActions,
    ...state,
  };
});
