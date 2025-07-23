import { ShowCustomHeaderMode } from "../../src/types";
import { MockInstance } from "../types";
import { createBaseTable } from "./baseTable";

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
    featuredAssetId: "",
    featuredAssetText: "",
  },
];

export function createInstancesTable() {
  const baseTable = createBaseTable(
    (instance: MockInstance) => instance.id,
    instanceSeeds
  );

  return {
    ...baseTable,
    getDefault: (): MockInstance => {
      if (baseTable.size() === 0) {
        throw new Error("No instances available");
      }
      return instanceSeeds[0]; // Return the first/default instance
    },
  };
}

export type InstancesTable = ReturnType<typeof createInstancesTable>;
