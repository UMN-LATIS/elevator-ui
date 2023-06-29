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

    async createDrawer(title: string) {
      const newDrawer = await api.createDrawer(title);
      this.drawers.push({
        id: newDrawer.drawerId,
        title: newDrawer.drawerTitle,
      });
    },

    async deleteDrawer(drawerId: number) {
      await api.deleteDrawer(drawerId);
      this.drawers = this.drawers.filter((drawer) => drawer.id !== drawerId);
    },
  },
});
