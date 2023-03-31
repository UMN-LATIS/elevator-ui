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

/**
 * This is the main store for the application.
 */

// we use a pinia "setup" store style
// so that we can automatically initialize the store
// with data from the api
export const useInstanceStore = defineStore("instance", () => {
  const fetchStatus = ref<FetchStatus>("idle");
  const currentUser = ref<User | null>(null);
  const pages = ref<Page[]>([]);
  const instance = ref<ElevatorInstance>({
    id: null,
    name: "Elevator",
    logoImg: null,
    contact: null,
    useCentralAuth: false,
    centralAuthLabel: "Central Auth",
    featuredAssetId: null,
    featuredAssetText: null,
  });
  const collections = ref<AssetCollection[]>([]);

  /**
   * get a fresh copy of the instance data from the api
   */
  async function refresh() {
    if (fetchStatus.value === "fetching") return;

    fetchStatus.value = "fetching";

    try {
      const apiResponse = await api.fetchInstanceNav();

      currentUser.value = selectCurrentUserFromResponse(apiResponse);
      pages.value = apiResponse.pages;
      instance.value = selectInstanceFromResponse(apiResponse);
      collections.value = apiResponse.collections;
      fetchStatus.value = "success";
    } catch (error) {
      console.error(error);
      fetchStatus.value = "error";
    }
  }

  const isLoggedIn = computed(() => !!currentUser.value);

  async function init() {
    // don't fetch if we already have data or are fetching
    if (["fetching", "success", "error"].includes(fetchStatus.value)) {
      return;
    }
    refresh();
  }

  // initialize store when created
  init();

  return {
    fetchStatus,
    pages,
    instance,
    currentUser,
    isLoggedIn,
    collections,
    refresh,
  };
});
