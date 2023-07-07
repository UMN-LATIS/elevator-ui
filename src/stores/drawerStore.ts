import { defineStore } from "pinia";
import { Drawer, DrawerSortOptions, SearchResultMatch } from "@/types";
import api from "@/api";
import { useToastStore } from "./toastStore";
import { useAssetStore } from "./assetStore";

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

    async addAssetToDrawer(assetId: string, drawerId: number) {
      await api.addAssetToDrawer(assetId, drawerId);

      const assetStore = useAssetStore();
      const toastStore = useToastStore();

      const drawerTitle = this.drawerRecords[drawerId].title;
      const assetTitle = await assetStore.getAssetTitle(assetId);
      toastStore.addToast({
        message: `'${assetTitle ?? "Asset"}' added to drawer '${drawerTitle}'.`,
        url: `/drawers/viewDrawer/${drawerId}`,
        urlText: "View drawer",
      });

      // invalidate the drawer contents so that it's refetched
      // on next access
      this.drawerRecords[drawerId].contents = undefined;
    },

    async addAssetListToDrawer(assetIds: string[], drawerId: number) {
      await api.addAssetListToDrawer(assetIds, drawerId);
      const toastStore = useToastStore();

      const drawerTitle = this.drawerRecords[drawerId].title;

      toastStore.addToast({
        message: `${assetIds.length} assets added to drawer '${drawerTitle}'.`,
        url: `/drawers/viewDrawer/${drawerId}`,
        urlText: "View drawer",
      });

      // invalidate the drawer contents so that it's refetched
      // on next access
      this.drawerRecords[drawerId].contents = undefined;
    },

    async refreshDrawer(drawerId: number) {
      const drawer = await api.getDrawer(drawerId);
      this.drawerRecords[drawerId] = drawer;
      return drawer;
    },

    async setDrawerSortBy(drawerId: number, sortBy: DrawerSortOptions) {
      // clear the drawer contents
      this.drawerRecords[drawerId].contents = undefined;
      await api.setDrawerSortBy(drawerId, sortBy);
      return this.refreshDrawer(drawerId);
    },

    async setDrawerItems(drawerId: number, items: SearchResultMatch[]) {
      const drawer = this.drawerRecords[drawerId];

      if (!drawer.contents) {
        throw new Error(`Cannot set drawer items: drawer contents not found`);
      }

      // check if the order has changed
      const currentOrder = drawer.contents.matches.map((item) => item.objectId);
      const newOrder = items.map((item) => item.objectId);

      // if nothing has changed, don't make a request
      if (currentOrder.join(",") === newOrder.join(",")) {
        return;
      }

      // optimistically update the drawer contents
      drawer.contents.matches = items;

      // update the drawer contents on the server
      api.setCustomDrawerOrder(drawerId, newOrder);
    },

    async removeAssetFromDrawer({
      assetId,
      drawerId,
    }: {
      assetId: string;
      drawerId: number;
    }) {
      const assetStore = useAssetStore();
      const drawerTitle = this.drawerRecords[drawerId].title;
      const assetTitle = await assetStore.getAssetTitle(assetId);

      if (!assetId) {
        throw new Error(`Cannot remove asset from drawer: no assetId provided`);
      }

      if (!drawerId) {
        throw new Error(
          `Cannot remove asset from drawer: no drawerId provided`
        );
      }

      // drawer contents should exist at this point
      if (!this.drawerRecords[drawerId].contents) {
        throw new Error(
          `Cannot remove asset from drawer: drawer contents not found`
        );
      }

      // optimistically remove the asset from the drawer
      const previousMatches = this.drawerRecords[drawerId].contents?.matches;

      if (previousMatches) {
        const updatedMatches = previousMatches.filter(
          (match) => match.objectId !== assetId
        );
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.drawerRecords[drawerId].contents!.matches = updatedMatches;
      }

      await api.removeAssetFromDrawer({
        assetId,
        drawerId,
      });

      const toastStore = useToastStore();
      toastStore.addToast({
        message: `Removed '${assetTitle}' from drawer '${drawerTitle}'.`,
      });
    },
  },
});
