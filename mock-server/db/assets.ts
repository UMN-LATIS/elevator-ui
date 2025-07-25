import { Asset, AssetPreview } from "../../src/types";
import { assetToSearchResultMatch } from "../utils/index";
import { createBaseTable } from "./baseTable";
import type { CollectionsTable } from "./collections";
import type { TemplatesTable } from "./templates";
import invariant from "tiny-invariant";
import { adminUser } from "./users";
import { MockUser } from "../types";

export const assetSeeds: Asset[] = [
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
    modifiedBy: adminUser.id,
    createdBy: adminUser.id,
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
    modifiedBy: adminUser.id,
    createdBy: adminUser.id,
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

export function createAssetsTable({
  collections,
  templates,
}: {
  collections: CollectionsTable;
  templates: TemplatesTable;
}) {
  const baseTable = createBaseTable(
    (asset: Asset) => asset.assetId,
    assetSeeds
  );

  return {
    ...baseTable,
    getByUserId: (userId: MockUser["id"]): AssetPreview[] => {
      const assets: Asset[] =
        baseTable.filter((asset) => asset.createdBy === userId) ?? [];

      return assets
        .map((asset) => {
          const collection = collections.get(asset.collectionId);
          const template = templates.get(asset.templateId);
          invariant(collection, `Collection ${asset.collectionId} not found`);
          invariant(template, `Template ${asset.templateId} not found`);
          return assetToSearchResultMatch({
            asset,
            collection,
            template,
          });
        })
        .filter(Boolean) as AssetPreview[];
    },
    create: (asset: Asset): Asset => {
      const newAsset = { ...asset, assetId: crypto.randomUUID() };
      baseTable.set(newAsset.assetId, newAsset);
      return newAsset;
    },
    update: (
      assetId: Asset["assetId"],
      updatedAsset: Partial<Asset>
    ): Asset | undefined => {
      const existingAsset = baseTable.get(assetId);
      if (!existingAsset) {
        throw new Error(`Asset with ID ${assetId} not found`);
      }
      const newAsset = { ...existingAsset, ...updatedAsset };
      baseTable.set(assetId, newAsset);
      return newAsset;
    },
    getPreview: (assetId: Asset["assetId"]): AssetPreview | null => {
      const asset = baseTable.get(assetId);
      if (!asset) {
        return null;
      }
      const collection = collections.get(asset.collectionId);
      const template = templates.get(asset.templateId);
      invariant(collection, `Collection ${asset.collectionId} not found`);
      invariant(template, `Template ${asset.templateId} not found`);
      return assetToSearchResultMatch({
        asset,
        collection,
        template,
      });
    },
  };
}

export type AssetsTable = ReturnType<typeof createAssetsTable>;
