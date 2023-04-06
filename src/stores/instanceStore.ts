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
    canSearchAndBrowse: false,
  }),
});

const getters = (state: ReturnType<typeof createState>) => ({
  isLoggedIn: computed(() => !!state.currentUser.value),
  isReady: computed(() => state.fetchStatus.value === "success"),
  collectionIndex: computed(() => toCollectionIndex(state.collections.value)),
  getCollectionById: (id: number) => {
    // since we're using a getter within another getter, we access that
    // through the `getters` function
    const index = getters(state).collectionIndex.value;
    return index[id];
  },
});

const actions = (state: ReturnType<typeof createState>) => {
  const refresh = async () => {
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
  };

  const init = async () => {
    if (["fetching", "success", "error"].includes(state.fetchStatus.value)) {
      return;
    }
    refresh();
  };

  return { refresh, init };
};

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
