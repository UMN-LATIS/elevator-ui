import { InstanceSettings, ShowCustomHeaderMode } from "../../src/types";
import { createBaseTable } from "./baseTable";
import { PagesTable } from "./pages";

const instanceSeeds: InstanceSettings[] = [
  {
    instanceId: 1,
    name: "defaultinstance",
    domain: "example.edu",
    ownerHomepage: null,
    googleAnalyticsKey: null,

    // featured asset
    featuredAsset: "687969fd9c90c709c1021d01",
    featuredAssetText: "This is a featured asset",

    // storage
    amazonS3Key: null,
    amazonS3Secret: null,
    defaultBucket: null,
    bucketRegion: null,

    showCollectionInSearchResults: true,
    showTemplateInSearchResults: true,
    showPreviousNextSearchResults: true,
    hideVideoAudio: false,
    allowIndexing: true,
    useVoyagerViewer: true,
    automaticAltText: true,
    autoloadMaxSearchResults: false,

    useCustomHeader: ShowCustomHeaderMode.HOME_PAGE_ONLY,
    customHeaderText: null,
    customFooterText: null,
    customHeaderCSS: null,
    useCustomCSS: false,
    useHeaderLogo: false,

    enableInterstitial: false,
    interstitialText: null,

    interfaceVersion: 1,
    useCentralAuth: true,
    centralAuthLabel: "University",
    enableHLSStreaming: false,
    enableTheming: false,
    defaultTheme: "light",
    availableThemes: ["light", "dark", "folwell"],

    customHomeRedirect: null,
    maximumMoreLikeThis: null,
    defaultTextTruncationHeight: null,
    notes: null,
    createdAt: null,
    modifiedAt: null,
  },
];

let nextId = instanceSeeds.length + 1;

export function createInstancesTable({ pages }: { pages: PagesTable }) {
  const baseTable = createBaseTable(
    (instance: InstanceSettings) => instance.instanceId,
    instanceSeeds
  );

  return {
    ...baseTable,
    maxId() {
      return Math.max(
        ...baseTable.getAll().map((instance) => instance.instanceId),
        0
      );
    },
    create: (
      instance: Omit<InstanceSettings, "instanceId">
    ): InstanceSettings => {
      const newInstance = {
        ...instance,
        instanceId: nextId++,
      };
      baseTable.set(newInstance.instanceId, newInstance);
      return newInstance;
    },
    get pages() {
      return pages.getAll();
    },
    getDefault: (): InstanceSettings => {
      if (baseTable.size() === 0) {
        throw new Error("No instances available");
      }
      const instance = baseTable.get(instanceSeeds[0].instanceId);
      if (!instance) {
        throw new Error("Default instance not found");
      }
      return instance;
    },
  };
}

export type InstancesTable = ReturnType<typeof createInstancesTable>;
