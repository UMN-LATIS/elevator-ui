import { Asset } from "../../src/types";

const assetSeeds: Asset[] = [
  {
    title_1: [
      {
        isPrimary: false,
        fieldContents: "Asset 1",
      },
    ],
    upload_1: [
      {
        loc: null,
        fileId: "6875872f4eb080a4880a0f45",
        fileType: "txt",
        sidecars: [],
        isPrimary: false,
        searchData: null,
        fileDescription: "file.txt",
      },
    ],
    checkbox_1: [
      {
        isPrimary: false,
        fieldContents: false,
      },
    ],
    relatedAssetCache: [],
    templateId: 1,
    readyForDisplay: true,
    collectionId: 1,
    availableAfter: null,
    modified: {
      date: "2025-07-14 22:40:25.000000",
      timezone_type: 3,
      timezone: "UTC",
    },
    modifiedBy: 1,
    createdBy: "",
    collectionMigration: null,
    deleted: false,
    deletedBy: null,
    deletedAt: null,
    csvBatch: null,
    assetId: "6875871d4eb080a4880a0f44",
    firstFileHandlerId: "687587494eb080a4880a0f46",
    firstObjectId: null,
    title: ["Asset 1"],
    titleObject: "title_1",
  },
  {
    title_1: [
      {
        isPrimary: false,
        fieldContents: "Asset 2",
      },
    ],
    upload_1: [
      {
        loc: null,
        fileId: "687969f8f53caa21660c9ee0",
        fileType: "png",
        sidecars: [],
        isPrimary: false,
        searchData: null,
        fileDescription: "test_image.png",
      },
      {
        loc: null,
        fileId: "68796a06f53caa21660c9ee1",
        fileType: "png",
        sidecars: [],
        isPrimary: false,
        searchData: null,
        fileDescription: "test_image_2.png",
      },
    ],
    checkbox_1: [
      {
        isPrimary: false,
        fieldContents: false,
      },
    ],
    relatedAssetCache: [],
    templateId: 1,
    readyForDisplay: true,
    collectionId: 1,
    availableAfter: null,
    modified: {
      date: "2025-07-17 21:25:26.000000",
      timezone_type: 3,
      timezone: "UTC",
    },
    modifiedBy: 1,
    createdBy: "",
    collectionMigration: null,
    deleted: false,
    deletedBy: null,
    deletedAt: null,
    csvBatch: null,
    assetId: "687969fd9c90c709c1021d00",
    firstFileHandlerId: "687969f8f53caa21660c9ee0",
    firstObjectId: null,
    title: ["Asset 2"],
    titleObject: "title_1",
  },
];

const assetStore = new Map<Asset["assetId"], Asset>(
  assetSeeds.map((asset) => [asset.assetId, asset])
);

export const assets = {
  create: (asset: Asset): Asset => {
    const newAsset = { ...asset, assetId: crypto.randomUUID() };
    assetStore.set(newAsset.assetId, newAsset);
    return newAsset;
  },
  get: (assetId: Asset["assetId"]): Asset | undefined => {
    return assetStore.get(assetId);
  },
  getById: (assetId: string): Asset | undefined => {
    return assetStore.get(assetId);
  },
  delete: (assetId: Asset["assetId"]): void => {
    assetStore.delete(assetId);
  },
  update: (
    assetId: Asset["assetId"],
    updatedAsset: Partial<Asset>
  ): Asset | undefined => {
    const existingAsset = assetStore.get(assetId);
    if (!existingAsset) {
      throw new Error(`Asset with ID ${assetId} not found`);
    }
    const newAsset = { ...existingAsset, ...updatedAsset };
    assetStore.set(assetId, newAsset);
    return newAsset;
  },
  search: (query: string): Asset[] => {
    const allAssets = Array.from(assetStore.values());
    if (!query) return allAssets;

    // not a real search
    // just stringify the assets and filter by the query
    const lowerQuery = query.toLowerCase();
    const matchedAssets = allAssets.filter((asset) => {
      const assetString = JSON.stringify(asset).toLowerCase();
      return assetString.includes(lowerQuery);
    });

    return matchedAssets;
  },
};
