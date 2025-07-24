import { MockDrawer } from "../types";
import { createBaseTable } from "./baseTable";

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

export function createDrawersTable() {
  const baseTable = createBaseTable(
    (drawer: MockDrawer) => drawer.id,
    drawerSeeds
  );
  let nextDrawerId = 2;

  return {
    ...baseTable,
    getByUserId: (userId: number): MockDrawer[] => {
      return baseTable.filter((d) => d.userId === userId);
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
      baseTable.set(drawer.id, drawer);
      return drawer;
    },
    addAssets: (drawerId: number, assetIds: string[]): void => {
      const drawer = baseTable.get(drawerId);
      if (drawer) {
        const combined = drawer.assetIds.concat(assetIds);
        drawer.assetIds = Array.from(new Set(combined));
        drawer.updatedAt = new Date();
      }
    },
    removeAssets: (drawerId: number, assetIds: string[]): void => {
      const drawer = baseTable.get(drawerId);
      if (drawer) {
        drawer.assetIds = drawer.assetIds.filter(
          (id) => !assetIds.includes(id)
        );
        drawer.updatedAt = new Date();
      }
    },
    // Override reset to also reset the counter
    reset: (): void => {
      baseTable.reset();
      nextDrawerId = 2;
    },
  };
}

export type DrawersTable = ReturnType<typeof createDrawersTable>;
