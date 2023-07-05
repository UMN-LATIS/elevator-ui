import { defineStore } from "pinia";
import { Drawer } from "@/types";
import api from "@/api";
import { useToastStore } from "./toastStore";

export interface DrawerStoreState {
  drawerRecords: Record<number, Drawer>;
  isReady: boolean;
}

export const useDrawerStore = defineStore("drawer", {
  state: (): DrawerStoreState => ({
    drawerRecords: {},
    isReady: false,
  }),
  getters: {
    drawers(state) {
      return Object.values(state.drawerRecords);
    },
    getDrawerById(state) {
      return (id: number) => state.drawerRecords[id];
    },
  },
  actions: {
    async refresh() {
      const drawers = await api.getDrawers({ refresh: true });
      this.drawerRecords = drawers.reduce((acc, drawer) => {
        acc[drawer.id] = drawer;
        return acc;
      }, {} as Record<number, Drawer>);
    },

    async init() {
      await this.refresh();
      this.isReady = true;
    },

    async createDrawer(title: string) {
      const data = await api.createDrawer(title);
      const newDrawer = {
        id: data.drawerId,
        title: data.drawerTitle,
      };
      this.drawerRecords[data.drawerId] = newDrawer;
      return newDrawer;
    },

    async deleteDrawer(drawerId: number) {
      try {
        // optimistically remove the drawer from the list
        delete this.drawerRecords[drawerId];
        await api.deleteDrawer(drawerId, { skipErrorNotifications: true });
      } catch (e) {
        console.log(
          `Failed to delete drawer: ${drawerId}. Refreshing the drawer list.`
        );

        // if the request fails for some reason, refresh the list
        await this.refresh();
      }
    },

    async addAssetToDrawer({
      assetId,
      drawerId,
    }: {
      assetId: string;
      drawerId: number;
    }) {
      await api.addAssetToDrawer({
        assetId,
        drawerId,
      });

      const drawerTitle = this.drawerRecords[drawerId].title;
      const toastStore = useToastStore();
      toastStore.addToast(`Asset added to drawer '${drawerTitle}'.`);

      // invalidate the drawer contents so that it's refetched
      // on next access
      this.drawerRecords[drawerId].contents = undefined;
    },

    async refreshDrawer(drawerId: number) {
      const drawer = await api.getDrawer(drawerId);
      this.drawerRecords[drawerId] = drawer;
      return drawer;
    },

    async removeAssetFromDrawer({
      assetId,
      drawerId,
    }: {
      assetId: string;
      drawerId: number;
    }) {
      // TODO
      console.log("removeAssetFromDrawer");
    },
  },
});
