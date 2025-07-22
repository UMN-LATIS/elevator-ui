import { ShowCustomHeaderMode } from "../../src/types";
import { MockInstance } from "../types";

const instanceSeeds = [
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
  },
];

const instanceStore = new Map<MockInstance["id"], MockInstance>(
  instanceSeeds.map((instance) => [instance.id, instance])
);

export const instances = {
  get: (instanceId: MockInstance["id"]): MockInstance | undefined => {
    return instanceStore.get(instanceId);
  },
};
