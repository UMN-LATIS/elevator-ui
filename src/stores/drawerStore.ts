import { defineStore } from "pinia";
import { Drawer } from "@/types";
import api from "@/api";

export interface DrawerStoreState {
  drawers: Drawer[];
}

export const useDrawerStore = defineStore("drawer", {
  state: (): DrawerStoreState => ({
    drawers: [],
  }),
  actions: {
    async refresh() {
      const drawers = await api.getDrawers({ refresh: true });
      this.drawers = drawers;
    },

    async init() {
      await this.refresh();
    },

    async createDrawer(name: string) {
      await api.createDrawer(name);
      await this.refresh();
    },
  },
});
