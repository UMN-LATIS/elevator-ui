import { Asset, AssetPreview } from "../../src/types";
import { assetToSearchResultMatch } from "../utils/index";
import { createBaseTable } from "./baseTable";
import type { CollectionsTable } from "./collections";
import type { TemplatesTable } from "./templates";

const generateMockAssets = (count = 100): Asset[] => {
  const baseAsset: Asset = {
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
  };

  const assets: Asset[] = [];
  const fileTypes = ["txt", "pdf", "docx", "jpg", "png", "mp4", "wav"];
  const subjects = [
    "Research",
    "Documentation",
    "Image",
    "Video",
    "Audio",
    "Report",
    "Analysis",
    "Study",
  ];

  for (let i = 1; i <= count; i++) {
    const fileType = fileTypes[i % fileTypes.length];
    const subject = subjects[i % subjects.length];
    const title = `${subject} Asset ${i}`;

    // Generate consistent but unique IDs
    const assetId = `asset_${crypto.randomUUID()}`;
    const fileId = `file_${crypto.randomUUID()}`;
    const handlerId = `handler_${crypto.randomUUID()}`;

    // Vary the date slightly for each asset
    const baseDate = new Date("2025-07-14T22:40:25Z");
    baseDate.setHours(baseDate.getHours() + i * 2); // Add 2 hours per asset

    const asset: Asset = {
      ...baseAsset,
      title_1: [
        {
          isPrimary: false,
          fieldContents: title,
        },
      ],
      upload_1: [
        {
          loc: null,
          fileId,
          fileType,
          sidecars: [],
          isPrimary: false,
          searchData: null,
          fileDescription: `${subject.toLowerCase()}_file_${i}.${fileType}`,
        },
      ],
      checkbox_1: [
        {
          isPrimary: false,
          fieldContents: i % 3 === 0, // Every third asset has checkbox true
        },
      ],
      assetId,
      firstFileHandlerId: handlerId,
      title: [title],
      modified: {
        date: baseDate.toISOString().replace("T", " ").replace("Z", ".000000"),
        timezone_type: 3,
        timezone: "UTC",
      },
      collectionId: (i % 3) + 1, // Distribute across collections 1, 2, 3
      modifiedBy: (i % 5) + 1, // Rotate through users 1-5
    };

    assets.push(asset);
  }

  return assets;
};

const assetSeeds: Asset[] = generateMockAssets();

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
      if (!collection || !template) {
        return null;
      }
      return assetToSearchResultMatch({
        asset,
        collection,
        template,
      });
    },
    getByUserId: (userId: number): AssetPreview[] => {
      return baseTable
        .filter(
          (asset) => asset.createdBy === userId || asset.modifiedBy === userId
        )
        .map((asset) => {
          const collection = collections.get(asset.collectionId);
          const template = templates.get(asset.templateId);
          if (!collection || !template) {
            return null;
          }
          return assetToSearchResultMatch({
            asset,
            collection,
            template,
          });
        })
        .filter((preview): preview is AssetPreview => preview !== null);
    },
  };
}

export type AssetsTable = ReturnType<typeof createAssetsTable>;
