import { defineStore } from "pinia";
import api from "@/helpers/api";
import { InstanceStoreState } from "@/types";
import { selectCurrentUserFromResponse } from "@/helpers/selectCurrentUserFromResponse";
import { selectInstanceFromResponse } from "@/helpers/selectInstanceFromResponse";

export const useInstanceStore = defineStore("instance", {
  state: (): InstanceStoreState => ({
    currentUser: null,
    pages: [],
    instance: {
      id: null,
      name: "Elevator",
      logoImg: null,
      contact: null,
      useCentralAuth: false,
      centralAuthLabel: "Central Auth",
    },
    collections: [],
  }),
  actions: {
    async init() {
      const apiResponse = await api.fetchInstanceNav();
      this.currentUser = selectCurrentUserFromResponse(apiResponse);
      this.pages = apiResponse.pages;
      this.instance = selectInstanceFromResponse(apiResponse);
      this.collections = apiResponse.collections;
    },
  },
});
