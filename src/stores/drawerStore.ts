import { defineStore } from "pinia";
import { Drawer } from "@/types";
import api from "@/api";

export interface DrawerStoreState {
  drawers: Drawer[];
  isReady: boolean;
}

export const useDrawerStore = defineStore("drawer", {
  state: (): DrawerStoreState => ({
    drawers: [],
    isReady: false,
  }),
  actions: {
    async refresh() {
      const drawers = await api.getDrawers({ refresh: true });
      this.drawers = drawers;
    },

    async init() {
      await this.refresh();
      this.isReady = true;
    },

    async createDrawer(title: string) {
      const newDrawer = await api.createDrawer(title);
      this.drawers.push({
        id: newDrawer.drawerId,
        title: newDrawer.drawerTitle,
      });
    },

    async deleteDrawer(drawerId: number) {
      try {
        // optimistically remove the drawer from the list
        this.drawers = this.drawers.filter((drawer) => drawer.id !== drawerId);
        await api.deleteDrawer(drawerId, { skipErrorNotifications: true });
      } catch (e) {
        console.log(
          `Failed to delete drawer: ${drawerId}. Refreshing the drawer list.`
        );

        // if the request fails for some reason, refresh the list
        await this.refresh();
      }
    },
  },
});
