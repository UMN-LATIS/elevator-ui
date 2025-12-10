import { ShowCustomHeaderMode } from "../../src/types";
import { MockInstance } from "../types";
import { createBaseTable } from "./baseTable";
import { PagesTable } from "./pages";

const instanceSeeds: MockInstance[] = [
  {
    id: 1,
    name: "defaultinstance",
    hasLogo: false,
    logo: 0,
    showCollectionInSearchResults: true,
    showTemplateInSearchResults: true,
    contact: "admin@example.com",
    useCentralAuth: true,
    centralAuthLabel: "University",
    sortableFields: {},
    customHeaderMode: ShowCustomHeaderMode.HOME_PAGE_ONLY,
    customHeader: null,
    customFooter: null,
    useVoyagerViewer: true,
    useCustomCSS: false,
    featuredAssetId: "687969fd9c90c709c1021d01",
    featuredAssetText: "This is a featured asset",
    pages: [],
  },
];

export function createInstancesTable({ pages }: { pages: PagesTable }) {
  const baseTable = createBaseTable(
    (instance: MockInstance) => instance.id,
    instanceSeeds
  );

  return {
    ...baseTable,
    get pages() {
      return pages.getAll();
    },
    getDefault: (): MockInstance => {
      if (baseTable.size() === 0) {
        throw new Error("No instances available");
      }
      // Get the instance from the store (which may have been updated)
      // rather than returning the seed data directly
      const instance = baseTable.get(instanceSeeds[0].id);
      if (!instance) {
        throw new Error("Default instance not found");
      }
      return instance;
    },
  };
}

export type InstancesTable = ReturnType<typeof createInstancesTable>;
