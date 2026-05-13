import { Asset, AssetPreview } from "../../src/types";
import { assetToSearchResultMatch } from "../utils/index";
import { createBaseTable } from "./baseTable";
import type { CollectionsTable } from "./collections";
import type { TemplatesTable } from "./templates";
import type { WithMeta } from "../types";

const baseAsset: WithMeta<Asset> = {
  _meta: { visibility: "public" },
  title_1: [
    {
      isPrimary: false,
      fieldContents: "Asset 1",
    },
  ],
  upload_1: [
    {
      loc: null,
      fileId: "687587494eb080a4880a0f46",
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

const generateMockAssets = (count = 100): WithMeta<Asset>[] => {
  const assets: Asset[] = [];
  const fileTypes = ["txt", "pdf", "docx", "jpg", "png", "mp4", "wav"];

  for (let i = 1; i <= count; i++) {
    const fileType = fileTypes[i % fileTypes.length];
    const title = `Asset ${i}`;

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
          fileDescription: `file.${fileType}`,
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
        date: baseDate.toISOString(),
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

// Assets with location + date data for map/timeline/drawer share testing
const locationAssetSeeds: WithMeta<Asset>[] = [
  {
    ...baseAsset,
    title_1: [
      { isPrimary: true, fieldContents: "Minneapolis Institute of Arts" },
    ],
    assetId: "location_asset_minneapolis",
    firstFileHandlerId: "handler_location_mpls",
    title: ["Minneapolis Institute of Arts"],
    location_1: [
      {
        isPrimary: true,
        locationLabel: "Minneapolis",
        address: "2400 3rd Ave S, Minneapolis, MN 55404",
        loc: { type: "Point", coordinates: [-93.2733, 44.9584] },
      },
    ],
    date_1: [
      {
        isPrimary: true,
        label: "",
        start: { text: "1883", numeric: "-2745964800" },
        end: { text: "", numeric: null },
      },
    ],
    modified: {
      date: "2021-01-01 00:00:00.000000",
      timezone_type: 3,
      timezone: "UTC",
    },
  },
  {
    ...baseAsset,
    title_1: [{ isPrimary: true, fieldContents: "Art Institute of Chicago" }],
    assetId: "location_asset_chicago",
    firstFileHandlerId: "handler_location_chi",
    title: ["Art Institute of Chicago"],
    location_1: [
      {
        isPrimary: true,
        locationLabel: "Chicago",
        address: "111 S Michigan Ave, Chicago, IL 60603",
        loc: { type: "Point", coordinates: [-87.6237, 41.8796] },
      },
    ],
    date_1: [
      {
        isPrimary: true,
        label: "",
        start: { text: "1879", numeric: "-2871964800" },
        end: { text: "", numeric: null },
      },
    ],
    modified: {
      date: "2022-06-15 00:00:00.000000",
      timezone_type: 3,
      timezone: "UTC",
    },
  },
  {
    ...baseAsset,
    title_1: [{ isPrimary: true, fieldContents: "SFMOMA" }],
    assetId: "location_asset_sf",
    firstFileHandlerId: "handler_location_sf",
    title: ["SFMOMA"],
    location_1: [
      {
        isPrimary: true,
        locationLabel: "San Francisco",
        address: "151 3rd St, San Francisco, CA 94103",
        loc: { type: "Point", coordinates: [-122.4009, 37.7857] },
      },
    ],
    date_1: [
      {
        isPrimary: true,
        label: "",
        start: { text: "1935", numeric: "-1104537600" },
        end: { text: "", numeric: null },
      },
    ],
    modified: {
      date: "2023-03-20 00:00:00.000000",
      timezone_type: 3,
      timezone: "UTC",
    },
  },
];

export const LOCATION_ASSET_IDS = locationAssetSeeds.map((a) => a.assetId);

const assetSeeds: WithMeta<Asset>[] = [
  ...locationAssetSeeds,
  baseAsset,
  // Asset with broken template for error boundary testing
  {
    ...baseAsset,
    title_1: [
      {
        isPrimary: false,
        fieldContents: "Broken Template Asset",
      },
    ],
    brokenselect_1: [
      {
        isPrimary: false,
        fieldContents: "some value",
      },
    ],
    assetId: "broken_template_asset_001",
    firstFileHandlerId: "handler_broken_template",
    title: ["Broken Template Asset"],
    templateId: 999, // Broken Template (for testing)
    modified: {
      date: "2025-07-14 22:40:25.000000",
      timezone_type: 3,
      timezone: "UTC",
    },
    collectionId: 1,
    modifiedBy: 1,
  },
  // Metadata-only asset (no file uploads)
  {
    ...baseAsset,
    title_1: [{ isPrimary: false, fieldContents: "Metadata Only Asset" }],
    upload_1: [],
    assetId: "metadata_only_asset_001",
    firstFileHandlerId: null,
    firstObjectId: null,
    title: ["Metadata Only Asset"],
    modified: {
      date: "2025-07-14 22:40:25.000000",
      timezone_type: 3,
      timezone: "UTC",
    },
    collectionId: 1,
    modifiedBy: 1,
  },
  // Special test asset for multiselect cascade tests
  {
    ...baseAsset,
    cascadeselect_1: [
      {
        isPrimary: false,
        fieldContents: {
          country: "usa",
          stateorprovince: "minnesota",
          city: "St. Paul",
          neighborhood: "Summit Hill",
        },
      },
    ],
    assetId: "687969fd9c90c709c1021d01",
    firstFileHandlerId: "handler_cascade_test",
    title: ["All Fields Asset"],
    templateId: 68, // All Fields Test template
    modified: {
      date: "2025-07-14 22:40:25.000000",
      timezone_type: 3,
      timezone: "UTC",
    },
    collectionId: 1,
    modifiedBy: 1,
  },
  // Asset with both clickable and non-clickable tags for contrast testing
  {
    ...baseAsset,
    title_1: [{ isPrimary: true, fieldContents: "Tag Contrast Test Asset" }],
    sometags_1: [
      {
        isPrimary: false,
        tags: ["archival", "photograph", "19th century"],
      },
    ],
    clickabletags_1: [
      {
        isPrimary: false,
        tags: ["Minneapolis", "portrait", "daguerreotype"],
      },
    ],
    assetId: "tag_contrast_test_001",
    firstFileHandlerId: "handler_tag_contrast_001",
    title: ["Tag Contrast Test Asset"],
    templateId: 68,
    collectionId: 1,
    modifiedBy: 1,
    modified: {
      date: "2026-04-01 12:00:00.000000",
      timezone_type: 3,
      timezone: "UTC",
    },
  },
  // Auth-required asset for testing 401 / login-redirect flows
  {
    ...baseAsset,
    title_1: [{ isPrimary: false, fieldContents: "Protected Asset" }],
    assetId: "protected_asset_001",
    firstFileHandlerId: "handler_protected_001",
    title: ["Protected Asset"],
    templateId: 1,
    collectionId: 1,
    modifiedBy: 1,
    modified: {
      date: "2026-04-01 12:00:00.000000",
      timezone_type: 3,
      timezone: "UTC",
    },
    _meta: { visibility: "authenticated" },
  },
  // Soft-deleted assets for trash tab testing
  {
    ...baseAsset,
    title_1: [{ isPrimary: false, fieldContents: "Deleted Photo Essay" }],
    assetId: "deleted_asset_001",
    firstFileHandlerId: "handler_deleted_001",
    title: ["Deleted Photo Essay"],
    templateId: 1,
    collectionId: 1,
    createdBy: 1,
    modifiedBy: 1,
    deleted: true,
    deletedBy: 1,
    deletedAt: "2026-03-15T10:30:00.000Z",
    modified: {
      date: "2026-03-10 08:00:00.000000",
      timezone_type: 3,
      timezone: "UTC",
    },
  },
  {
    ...baseAsset,
    title_1: [{ isPrimary: false, fieldContents: "Deleted Audio Recording" }],
    assetId: "deleted_asset_002",
    firstFileHandlerId: "handler_deleted_002",
    title: ["Deleted Audio Recording"],
    templateId: 1,
    collectionId: 2,
    createdBy: 1,
    modifiedBy: 1,
    deleted: true,
    deletedBy: 1,
    deletedAt: "2026-03-16T14:45:00.000Z",
    modified: {
      date: "2026-03-12 12:00:00.000000",
      timezone_type: 3,
      timezone: "UTC",
    },
  },
  {
    ...baseAsset,
    title_1: [{ isPrimary: false, fieldContents: "Deleted Video Clip" }],
    assetId: "deleted_asset_003",
    firstFileHandlerId: "handler_deleted_003",
    title: ["Deleted Video Clip"],
    templateId: 1,
    collectionId: 1,
    createdBy: 2,
    modifiedBy: 2,
    deleted: true,
    deletedBy: 2,
    deletedAt: "2026-03-17T09:15:00.000Z",
    modified: {
      date: "2026-03-14 16:30:00.000000",
      timezone_type: 3,
      timezone: "UTC",
    },
  },
  // Auth-required child for collapsed related asset parent-id test
  {
    ...baseAsset,
    title_1: [{ isPrimary: false, fieldContents: "Protected Child Asset" }],
    assetId: "protected_child_001",
    firstFileHandlerId: "handler_protected_child_001",
    title: ["Protected Child Asset"],
    templateId: 1,
    collectionId: 1,
    modifiedBy: 1,
    modified: {
      date: "2026-04-01 12:00:00.000000",
      timezone_type: 3,
      timezone: "UTC",
    },
    _meta: { visibility: "authenticated" },
  },
  // Public parent with collapsed related asset pointing to the protected child
  {
    ...baseAsset,
    title_1: [
      { isPrimary: false, fieldContents: "Parent With Protected Child" },
    ],
    collapsedchild_1: [
      {
        isPrimary: false,
        targetAssetId: "protected_child_001",
      },
    ],
    relatedAssetCache: {
      protected_child_001: {
        relatedAssetTitle: ["Protected Child Asset"],
        primaryHandler: null,
        primaryHandlerTiny: null,
        primaryHandlerTiny2x: null,
      },
    },
    assetId: "collapsed_parent_001",
    firstFileHandlerId: null,
    firstObjectId: null,
    title: ["Parent With Protected Child"],
    templateId: 103,
    collectionId: 1,
    modifiedBy: 1,
    modified: {
      date: "2026-04-01 12:00:00.000000",
      timezone_type: 3,
      timezone: "UTC",
    },
    _meta: { visibility: "public" },
  },
  ...generateMockAssets(),
];

export function createAssetsTable({
  collections,
  templates,
}: {
  collections: CollectionsTable;
  templates: TemplatesTable;
}) {
  const baseTable = createBaseTable(
    (asset: WithMeta<Asset>) => asset.assetId,
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
    getByUserId: (userId: number) => {
      return baseTable
        .filter(
          (asset) =>
            !asset.deleted &&
            (asset.createdBy === userId || asset.modifiedBy === userId)
        )
        .map((asset) => ({
          objectId: asset.assetId,
          title: asset.title?.[0] ?? "(Untitled)",
          readyForDisplay: asset.readyForDisplay ?? false,
          templateId: asset.templateId,
          modifiedDate: asset.modified,
        }));
    },
    getDeletedByUser: (userId: number) => {
      return baseTable
        .filter((asset) => asset.deleted === true && asset.deletedBy === userId)
        .map((asset) => ({
          objectId: asset.assetId,
          title: asset.title?.[0] ?? "(Untitled)",
          readyForDisplay: asset.readyForDisplay ?? false,
          templateId: asset.templateId,
          modifiedDate: asset.modified,
          deletedAt: asset.deletedAt,
          deletedBy: asset.deletedBy,
        }));
    },
  };
}

export type AssetsTable = ReturnType<typeof createAssetsTable>;
