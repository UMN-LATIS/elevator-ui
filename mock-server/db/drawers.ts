import { Drawer } from "../../src/types";

const drawerSeeds: Drawer[] = [{ id: 1, title: "My Drawer" }];

const drawerStore = new Map<Drawer["id"], Drawer>(
  drawerSeeds.map((drawer) => [drawer.id, drawer])
);

export const drawers = {
  get: (drawerId: Drawer["id"]): Drawer | undefined => {
    return drawerStore.get(drawerId);
  },
  getAll: (): Drawer[] => {
    return Array.from(drawerStore.values());
  },
};
