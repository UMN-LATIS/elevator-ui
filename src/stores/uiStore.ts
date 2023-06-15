import { defineStore } from "pinia";

export const useUIStore = defineStore({
  id: "ui",

  state: () => ({
    isAppMenuOpen: false,
    modals: {
      isAddAssetModalOpen: false,
    },
  }),

  getters: {
    isAnyModalOpen: (state) => {
      return Object.values(state.modals).some((value) => value);
    },
  },

  actions: {
    toggleAppMenu() {
      this.isAppMenuOpen = !this.isAppMenuOpen;
    },

    toggleAddAssetModal() {
      this.modals.isAddAssetModalOpen = !this.modals.isAddAssetModalOpen;
    },
  },
});
