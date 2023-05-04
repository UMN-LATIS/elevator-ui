import { defineStore } from "pinia";
import api from "@/api";
import { selectCurrentUserFromResponse } from "@/helpers/selectCurrentUserFromResponse";
import { selectInstanceFromResponse } from "@/helpers/selectInstanceFromResponse";
import { ref, computed } from "vue";
import {
  FetchStatus,
  Page,
  ElevatorInstance,
  User,
  AssetCollection,
} from "@/types";
import {
  toCollectionIndex,
  normalizeAssetCollections,
} from "@/helpers/collectionHelpers";

const createState = () => ({
  fetchStatus: ref<FetchStatus>("idle"),
  currentUser: ref<User | null>(null),
  pages: ref<Page[]>([]),
  collections: ref<AssetCollection[]>([]),
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
  }),
});

const getters = (state: ReturnType<typeof createState>) => ({
  isLoggedIn: computed(() => !!state.currentUser.value),
  isReady: computed(() => state.fetchStatus.value === "success"),
  collectionIndex: computed(() => toCollectionIndex(state.collections.value)),
  async getCollectionById(
    id: number
  ): Promise<Required<AssetCollection> | null> {
    const index = getters(state).collectionIndex.value;
    const collection = index[id];
    if (!collection) return null;

    // include the collection description
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
    actions(state).refresh();
  },
});

export const useInstanceStore = defineStore("instance", () => {
  const state = createState();
  const storeGetters = getters(state);
  const storeActions = actions(state);

  storeActions.init();

  return {
    ...state,
    ...storeGetters,
    ...storeActions,
  };
});
