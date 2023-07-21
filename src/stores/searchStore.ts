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
  GlobalSearchableFileType,
} from "@/types";
import { GLOBAL_FIELD_IDS, SORT_KEYS } from "@/constants/constants";
import { useInstanceStore } from "./instanceStore";
import { parseDateString } from "@/helpers/parseDateString";

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
    globalDateRange: null | {
      startDate: string;
      endDate: string;
      createdAt: string;
    };
    globalLocation: null | {
      lng: string; // -180 to 180
      lat: string; // -90 to 90
      radius: string; // in miles
      createdAt: string;
    };
    globalFileType: null | {
      fileType: GlobalSearchableFileType;
      createdAt: string;
    };
    includeHiddenAssets: boolean; // only available for admins
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
    globalDateRange: null,
    globalLocation: null,
    globalFileType: null,
    includeHiddenAssets: false,
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

  isValidSearch: computed(() => {
    // make sure if there's a location search, the radius is valid
    if (state.filterBy.globalLocation) {
      const radius = parseFloat(state.filterBy.globalLocation.radius);
      if (isNaN(radius) || radius <= 0) {
        return false;
      }
    }

    return true;
  }),

  hasMoreResults: computed(() => {
    return state.matches.value.length < (state.totalResults.value ?? 0);
  }),

  hasDateRangeFilter: computed(() => {
    return state.filterBy.globalDateRange !== null;
  }),

  hasLocationFilter: computed(() => {
    return state.filterBy.globalLocation !== null;
  }),

  hasFileTypeFilter: computed(() => {
    return state.filterBy.globalFileType !== null;
  }),

  filteredByCount: computed((): number => {
    return (
      state.filterBy.collectionIds.length +
      state.filterBy.specificFieldsMap.size +
      (state.filterBy.globalDateRange ? 1 : 0) +
      (state.filterBy.globalLocation ? 1 : 0) +
      (state.filterBy.includeHiddenAssets ? 1 : 0) +
      (state.filterBy.globalFileType ? 1 : 0)
    );
  }),

  // this is the number of specific fields that are being used
  specificFieldFilterCount: computed((): number => {
    return state.filterBy.specificFieldsMap.size;
  }),

  // this is the number of global fields that are being used
  globalFieldFilterCount: computed((): number => {
    return (
      (state.filterBy.globalDateRange ? 1 : 0) +
      (state.filterBy.globalLocation ? 1 : 0) +
      (state.filterBy.globalFileType ? 1 : 0)
    );
  }),

  totalFieldFilterCount: computed((): number => {
    return (
      getters(state).specificFieldFilterCount.value +
      getters(state).globalFieldFilterCount.value
    );
  }),

  hasFieldFiltersApplied: computed((): boolean => {
    return getters(state).totalFieldFilterCount.value > 0;
  }),

  globalDateRangeAsFilter: computed(
    (): SearchableSpecificFieldFilter | null => {
      if (!state.filterBy.globalDateRange) {
        return null;
      }

      return {
        id: GLOBAL_FIELD_IDS.DATE_RANGE,
        fieldId: GLOBAL_FIELD_IDS.DATE_RANGE,
        value: JSON.stringify([
          state.filterBy.globalDateRange?.startDate ?? null,
          state.filterBy.globalDateRange?.endDate ?? null,
        ]),
        isFuzzy: false,
        createdAt: state.filterBy.globalDateRange.createdAt,
      };
    }
  ),

  globalLocationAsFilter: computed((): SearchableSpecificFieldFilter | null => {
    if (!state.filterBy.globalLocation) {
      return null;
    }

    return {
      id: GLOBAL_FIELD_IDS.LOCATION,
      fieldId: GLOBAL_FIELD_IDS.LOCATION,
      value: JSON.stringify({
        lng: state.filterBy.globalLocation.lng,
        lat: state.filterBy.globalLocation.lat,
      }),
      isFuzzy: false,
      createdAt: state.filterBy.globalLocation.createdAt,
    };
  }),

  globalFileTypeAsFilter: computed((): SearchableSpecificFieldFilter | null => {
    if (!state.filterBy.globalFileType) {
      return null;
    }

    return {
      id: GLOBAL_FIELD_IDS.FILE_TYPE,
      fieldId: GLOBAL_FIELD_IDS.FILE_TYPE,
      value: state.filterBy.globalFileType.fileType,
      isFuzzy: false,
      createdAt: state.filterBy.globalFileType.createdAt,
    };
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

    const startDateText =
      state.filterBy.globalDateRange?.startDate.toString() ?? "";
    const endDateText =
      state.filterBy.globalDateRange?.endDate.toString() ?? "";

    return {
      sort: state.sort.value,
      collection: state.filterBy.collectionIds.length
        ? state.filterBy.collectionIds
        : undefined,
      combineSpecificSearches: state.filterBy.searchableFieldsOperator,
      specificFieldSearch,
      startDateText,
      startDate: parseDateString(startDateText) ?? "",
      endDateText,
      endDate: parseDateString(endDateText) ?? "",
      longitude: state.filterBy.globalLocation?.lng ?? "",
      latitude: state.filterBy.globalLocation?.lat ?? "",
      distance: state.filterBy.globalLocation?.radius ?? "",
      fileTypesSearch: state.filterBy.globalFileType?.fileType,
      showHidden: state.filterBy.includeHiddenAssets ? "on" : undefined,
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
    // get the search ID for this sort option
    state.searchId.value = await this.getSearchId();

    // update search results
    return this.search(state.searchId.value);
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
    state.filterBy.globalDateRange = {
      startDate: "",
      endDate: "",
      createdAt: new Date().toISOString(),
    };
  },

  removeDateRangeFilter() {
    state.filterBy.globalDateRange = null;
  },

  addLocationFilter() {
    state.filterBy.globalLocation = {
      lng: "-93.2277",
      lat: "44.9740",
      radius: "500",
      createdAt: new Date().toISOString(),
    };
  },

  removeLocationFilter() {
    state.filterBy.globalLocation = null;
  },

  updateLocationFilter(
    updatedLocation: Partial<{
      lng: string; // -180 to 180
      lat: string; // -90 to 90
      radius: string; // in miles
    }>
  ) {
    const currentLocation = state.filterBy.globalLocation;

    if (!currentLocation) {
      throw new Error(
        "Cannot update location filter. No location filter exists."
      );
    }

    state.filterBy.globalLocation = {
      ...currentLocation,
      ...updatedLocation,
    };
  },

  addFileTypeFilter() {
    state.filterBy.globalFileType = {
      fileType: "",
      createdAt: new Date().toISOString(),
    };
  },

  updateFileTypeFilter(fileType: GlobalSearchableFileType) {
    const currentFileType = state.filterBy.globalFileType;

    if (!currentFileType) {
      throw new Error(
        "Cannot update file type filter. No file type filter exists."
      );
    }

    state.filterBy.globalFileType = {
      ...currentFileType,
      fileType,
    };
  },

  removeFileTypeFilter() {
    state.filterBy.globalFileType = null;
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
    state.filterBy.globalDateRange = null;
    state.filterBy.globalLocation = null;
    state.filterBy.globalFileType = null;
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

  clearQuery() {
    state.query.value = "";
  },

  clearAllFilters() {
    this.clearCollectionIdFilters();
    this.clearSearchableFieldsFilters();
    state.filterBy.searchableFieldsOperator = "AND";
    state.filterBy.includeHiddenAssets = false;
  },

  reset() {
    this.clearAllFilters();
    this.clearQuery();
  },

  async getSearchId(): Promise<string> {
    return api
      .getSearchId(state.query.value, getters(state).searchRequestOptions.value)
      .catch((err) => {
        throw new Error(`Cannot getSearchId for query: ${state.query}: ${err}`);
      });
  },

  async search(searchId: string): Promise<string | void> {
    const instanceStore = useInstanceStore();
    // call all registered before handlers
    state.beforeNewSearchHandlers.forEach((fn) => fn());

    // clear old search results
    state.status.value = "fetching";
    state.searchId.value = searchId;
    state.matches.value = [];
    state.totalResults.value = undefined;
    state.currentPage.value = 0;
    state.searchEntry.value = null;

    try {
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
              // if the searchable field doesn't exist in our list of fields,
              // then ignore it
              if (!instanceStore.getSearchableField(searchField.field)) {
                console.log("skipping search entry field", searchField.field);
                return;
              }

              console.log("adding search entry field", searchField.field);
              actions(state).addSearchableFieldFilter(searchField.field, {
                value: searchField.text,
                isFuzzy: searchField.fuzzy,
              });
            });
          }

          // set the global date range if included
          if (res.searchEntry.startDateText || res.searchEntry.endDateText) {
            state.filterBy.globalDateRange = {
              startDate: res.searchEntry?.startDateText ?? "",
              endDate: res.searchEntry?.endDateText ?? "",
              createdAt: new Date().toISOString(),
            };
          } else {
            state.filterBy.globalDateRange = null;
          }

          // set the location filter if included
          if (
            res.searchEntry.longitude &&
            res.searchEntry.latitude &&
            res.searchEntry.distance
          ) {
            state.filterBy.globalLocation = {
              lng: res.searchEntry.longitude,
              lat: res.searchEntry.latitude,
              radius: res.searchEntry.distance,
              createdAt: new Date().toISOString(),
            };
          } else {
            state.filterBy.globalLocation = null;
          }

          // set the file type filter if included
          if (res.searchEntry?.fileTypesSearch) {
            state.filterBy.globalFileType = {
              fileType: res.searchEntry.fileTypesSearch,
              createdAt: new Date().toISOString(),
            };
          } else {
            state.filterBy.globalFileType = null;
          }

          // set the include hidden assets filter if included
          state.filterBy.includeHiddenAssets = !!res.searchEntry.showHidden;

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
      console.error("cannot load more results, already at the end");
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
