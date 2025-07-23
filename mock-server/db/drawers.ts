import { MockDrawer } from "../types";

const drawerSeeds: MockDrawer[] = [
  {
    id: 1,
    name: "My Drawer",
    description: "A sample drawer",
    userId: 1,
    assetIds: ["6875871d4eb080a4880a0f44"],
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const drawerStore = new Map<MockDrawer["id"], MockDrawer>(
  drawerSeeds.map((drawer) => [drawer.id, drawer])
);

let nextDrawerId = 2;

export const drawers = {
  get: (drawerId: number): MockDrawer | undefined => {
    return drawerStore.get(drawerId);
  },
  getAll: (): MockDrawer[] => {
    return Array.from(drawerStore.values());
  },
  getByUserId: (userId: number): MockDrawer[] => {
    return Array.from(drawerStore.values()).filter((d) => d.userId === userId);
  },
  create: (
    data: Pick<
      MockDrawer,
      "name" | "userId" | "description" | "assetIds" | "isPublic"
    >
  ): MockDrawer => {
    const drawer: MockDrawer = {
      id: nextDrawerId++,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    drawerStore.set(drawer.id, drawer);
    return drawer;
  },
  delete: (drawerId: number): void => {
    drawerStore.delete(drawerId);
  },
  addAssets: (drawerId: number, assetIds: string[]): void => {
    const drawer = drawerStore.get(drawerId);
    if (drawer) {
      const combined = drawer.assetIds.concat(assetIds);
      drawer.assetIds = Array.from(new Set(combined));
      drawer.updatedAt = new Date();
    }
  },
  removeAssets: (drawerId: number, assetIds: string[]): void => {
    const drawer = drawerStore.get(drawerId);
    if (drawer) {
      drawer.assetIds = drawer.assetIds.filter((id) => !assetIds.includes(id));
      drawer.updatedAt = new Date();
    }
  },
};
