import { defineStore } from "pinia";
import api from "@/api";
import { selectCurrentUserFromResponse } from "@/helpers/selectCurrentUserFromResponse";
import { selectInstanceFromResponse } from "@/helpers/selectInstanceFromResponse";
import {
  getScriptsFromHTML,
  executeScripts,
  removeScriptsFromHtml,
} from "@/helpers/customScriptHelpers";
import { ref, computed } from "vue";
import {
  FetchStatus,
  Page,
  ElevatorInstance,
  User,
  AssetCollection,
  SearchableSpecificField,
  ShowCustomHeaderMode,
} from "@/types";
import {
  toCollectionIndex,
  normalizeAssetCollections,
  flattenCollections,
  filterCollections,
} from "@/helpers/collectionHelpers";

const createState = () => ({
  fetchStatus: ref<FetchStatus>("idle"),
  currentUser: ref<User | null>(null),
  pages: ref<Page[]>([]),
  collections: ref<AssetCollection[]>([]),
  searchableFields: ref<SearchableSpecificField[]>([]),
  instance: ref<ElevatorInstance>({
    id: null,
    name: "Elevator",
    logoImg: null,
    contact: null,
    useCentralAuth: false,
    centralAuthLabel: "Central Auth",
    featuredAssetId: null,
    featuredAssetText: null,
    userCanSearchAndBrowse: false,
    templates: [],
    showCollectionInSearchResults: true,
    showTemplateInSearchResults: true,
    useVoyagerViewer: false, // whether or not to use the Voyager viewer
  }),
  customHeaderMode: ref<ShowCustomHeaderMode>(ShowCustomHeaderMode.NEVER),
  customHeader: ref<string | null>(null),
  customFooter: ref<string | null>(null),
  customScripts: ref<HTMLScriptElement[]>([]),
  hasExecutedCustomScripts: ref<boolean>(false),
});

const getters = (state: ReturnType<typeof createState>) => ({
  isLoggedIn: computed(() => !!state.currentUser.value),
  isReady: computed(() => state.fetchStatus.value === "success"),
  collectionIndex: computed(() => toCollectionIndex(state.collections.value)),
  viewableCollections: computed((): AssetCollection[] =>
    filterCollections((col) => col.canView, state.collections.value)
  ),
  browsableCollections: computed((): AssetCollection[] =>
    filterCollections(
      (col) => col.canView && col.showInBrowse,
      state.collections.value
    )
  ),

  flatCollections: computed(() => flattenCollections(state.collections.value)),
  flatViewableCollections: computed((): Omit<AssetCollection, "children">[] =>
    flattenCollections(getters(state).viewableCollections.value)
  ),
  flatBrowsableCollections: computed((): Omit<AssetCollection, "children">[] =>
    flattenCollections(getters(state).browsableCollections.value)
  ),
  async getCollectionById(
    id: number
  ): Promise<Required<AssetCollection> | null> {
    const index = getters(state).collectionIndex.value;
    const collection = index[id];
    if (!collection) return null;

    try {
      const description = await api.getCollectionDescription(id);
      return {
        ...collection,
        description,
      };
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  getSearchableField<
    T extends SearchableSpecificField = SearchableSpecificField
  >(fieldId: string): T | null {
    return (
      (state.searchableFields.value.find((f) => f.id === fieldId) as T) ?? null
    );
  },
});

const actions = (state: ReturnType<typeof createState>) => ({
  async refresh() {
    if (state.fetchStatus.value === "fetching") return;
    state.fetchStatus.value = "fetching";

    try {
      const apiResponse = await api.fetchInstanceNav();

      state.currentUser.value = selectCurrentUserFromResponse(apiResponse);
      state.pages.value = apiResponse.pages;
      state.instance.value = selectInstanceFromResponse(apiResponse);
      state.collections.value = normalizeAssetCollections(
        apiResponse.collections
      );
      state.customHeaderMode.value = apiResponse.customHeaderMode;

      // Store script-free HTML
      state.customHeader.value = removeScriptsFromHtml(
        apiResponse.customHeader
      );
      state.customFooter.value = removeScriptsFromHtml(
        apiResponse.customFooter
      );

      // Extract scripts from custom header and footer
      const headerScripts = getScriptsFromHTML(apiResponse.customHeader);
      const footerScripts = getScriptsFromHTML(apiResponse.customFooter);

      // store header and footer scripts
      state.customScripts.value = [...headerScripts, ...footerScripts];

      // add id to searchable field object from api response
      state.searchableFields.value = Object.entries(
        apiResponse.sortableFields
      ).map(([fieldId, field]) => ({
        ...field,
        id: fieldId,
      }));

      state.fetchStatus.value = "success";
    } catch (error) {
      console.error(error);
      state.fetchStatus.value = "error";
    }
  },

  async init() {
    if (["fetching", "success", "error"].includes(state.fetchStatus.value)) {
      return;
    }
    await actions(state).refresh();

    // Execute custom scripts only on init,
    // not on refresh
    executeScripts(state.customScripts.value as HTMLScriptElement[]);
    state.hasExecutedCustomSripts.value = true;
  },
});

export const useInstanceStore = defineStore("instance", () => {
  const state = createState();
  const storeGetters = getters(state);
  const storeActions = actions(state);

  return {
    ...state,
    ...storeGetters,
    ...storeActions,
  };
});
