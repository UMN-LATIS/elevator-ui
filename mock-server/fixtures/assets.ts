import type { 
  Asset, 
  AssetSummary, 
  SearchResultMatch, 
  TemplateEntry, 
  RawAssetCollection,
  FileDownloadNormalized,
  WidgetContent 
} from "../../src/types/index";
import { mockTemplates, mockCollections, mockSearchMatches } from "./search";

// File data that corresponds to our assets
export const mockFiles = {
  testDoc: {
    filetype: "application/pdf",
    isReady: true,
    url: "/fileManager/getFileById/file123/original",
    originalFilename: "test-document.pdf",
    extension: "pdf",
  } as FileDownloadNormalized,
  
  sampleArchive: {
    filetype: "application/zip",
    isReady: true,
    url: "/fileManager/getFileById/file124/original", 
    originalFilename: "sample-digital-archive.zip",
    extension: "zip",
  } as FileDownloadNormalized,
  
  historicPhoto: {
    filetype: "image/jpeg",
    isReady: true,
    url: "/fileManager/getFileById/file125/original",
    originalFilename: "historic-photograph.jpg",
    extension: "jpg",
  } as FileDownloadNormalized,
  
  basicFile: {
    filetype: "text/plain",
    isReady: true,
    url: "/fileManager/getFileById/file126/original",
    originalFilename: "basic-file.txt",
    extension: "txt",
  } as FileDownloadNormalized,
};

// Create assets that correspond to our search results
export const mockAssets: Record<string, Asset> = {
  // Asset corresponding to "test document" from search results
  "687138947074c3fd4e03493a": {
    assetId: "687138947074c3fd4e03493a",
    templateId: mockTemplates.someFields.id,
    readyForDisplay: true,
    collectionId: mockCollections.default.id,
    availableAfter: null,
    modified: new Date("2025-07-11 16:15:16"),
    modifiedBy: "testuser",
    createdBy: "testuser", 
    deletedBy: null,
    relatedAssetCache: null,
    objectId: "687138947074c3fd4e03493a",
    widgets: {
      "title_1": {
        widgetId: "1",
        fieldTitle: "title",
        widgetContents: "test document"
      } as WidgetContent,
      "description_2": {
        widgetId: "2", 
        fieldTitle: "description",
        widgetContents: "A test document for e2e testing"
      } as WidgetContent,
    },
    fileObjectIds: ["file123"],
  } as Asset,

  // Asset corresponding to "Another test asset" from search results  
  "687138941c0efc795e0bcd28": {
    assetId: "687138941c0efc795e0bcd28",
    templateId: mockTemplates.someFields.id,
    readyForDisplay: true,
    collectionId: mockCollections.default.id,
    availableAfter: null,
    modified: new Date("2025-07-11 16:15:16"),
    modifiedBy: "testuser",
    createdBy: "testuser",
    deletedBy: null,
    relatedAssetCache: null,
    objectId: "687138941c0efc795e0bcd28",
    widgets: {
      "title_1": {
        widgetId: "1",
        fieldTitle: "title", 
        widgetContents: "Another test asset"
      } as WidgetContent,
      "description_2": {
        widgetId: "2",
        fieldTitle: "description",
        widgetContents: "Another asset for testing purposes"
      } as WidgetContent,
    },
    fileObjectIds: ["file123"],
  } as Asset,

  // Asset corresponding to "Sample digital archive" from search results
  "687138947074c3fd4e03493b": {
    assetId: "687138947074c3fd4e03493b", 
    templateId: mockTemplates.digitalTemplate.id,
    readyForDisplay: true,
    collectionId: mockCollections.sample.id,
    availableAfter: null,
    modified: new Date("2025-07-10 14:30:22"),
    modifiedBy: "testuser",
    createdBy: "testuser",
    deletedBy: null,
    relatedAssetCache: null,
    objectId: "687138947074c3fd4e03493b",
    widgets: {
      "title_1": {
        widgetId: "1",
        fieldTitle: "title",
        widgetContents: "Sample digital archive"
      } as WidgetContent,
      "description_2": {
        widgetId: "2", 
        fieldTitle: "description",
        widgetContents: "A sample digital archive for testing"
      } as WidgetContent,
    },
    fileObjectIds: ["file124"],
  } as Asset,

  // Asset corresponding to "Historic photograph" from search results
  "687138947074c3fd4e03493c": {
    assetId: "687138947074c3fd4e03493c",
    templateId: mockTemplates.imageTemplate.id,
    readyForDisplay: true,
    collectionId: mockCollections.historic.id,
    availableAfter: null,
    modified: new Date("2025-07-09 12:45:33"),
    modifiedBy: "testuser",
    createdBy: "testuser",
    deletedBy: null,
    relatedAssetCache: null,
    objectId: "687138947074c3fd4e03493c",
    widgets: {
      "title_1": {
        widgetId: "1",
        fieldTitle: "title",
        widgetContents: "Historic photograph"
      } as WidgetContent,
      "description_2": {
        widgetId: "2",
        fieldTitle: "description", 
        widgetContents: "A historic photograph from the archives"
      } as WidgetContent,
    },
    fileObjectIds: ["file125"],
  } as Asset,

  // Asset corresponding to "Empty search result" from search results
  "687138947074c3fd4e03493d": {
    assetId: "687138947074c3fd4e03493d",
    templateId: mockTemplates.basicTemplate.id,
    readyForDisplay: true,
    collectionId: mockCollections.default.id,
    availableAfter: null,
    modified: new Date("2025-07-08 10:20:15"),
    modifiedBy: "testuser",
    createdBy: "testuser",
    deletedBy: null,
    relatedAssetCache: null,
    objectId: "687138947074c3fd4e03493d",
    widgets: {
      "title_1": {
        widgetId: "1",
        fieldTitle: "title",
        widgetContents: "Empty search result"
      } as WidgetContent,
      "description_2": {
        widgetId: "2",
        fieldTitle: "description",
        widgetContents: "An asset used for testing empty search scenarios"
      } as WidgetContent,
    },
    fileObjectIds: ["file126"],
  } as Asset,
};

// Asset summaries for user assets list
export const mockAssetSummaries: AssetSummary[] = Object.values(mockAssets).map(asset => ({
  objectId: asset.objectId,
  title: asset.widgets.title_1?.widgetContents as string || "Untitled",
  readyForDisplay: asset.readyForDisplay,
  templateId: asset.templateId,
  modifiedDate: {
    date: asset.modified.toISOString().replace('T', ' ').substring(0, 19),
    timezone_type: 3,
    timezone: "UTC",
  },
}));

// More like this results (related assets)
export const mockMoreLikeThisResults = mockSearchMatches.slice(0, 3).map(match => ({
  objectId: match.objectId,
  title: match.title?.toString() || "Untitled",
  description: mockAssets[match.objectId]?.widgets.description_2?.widgetContents as string || "",
  thumbnail: `/fileManager/getDerivativeById/${mockAssets[match.objectId]?.fileObjectIds?.[0]}/thumbnail`,
  collectionId: match.collectionHierarchy[0]?.id || 1,
  templateId: match.template.id,
}));

// Asset previews (for search result cards)
export const mockAssetPreviews = mockSearchMatches.map(match => ({
  objectId: match.objectId,
  title: match.title?.toString() || "Untitled", 
  description: mockAssets[match.objectId]?.widgets.description_2?.widgetContents as string || "",
  thumbnail: `/fileManager/getDerivativeById/${mockAssets[match.objectId]?.fileObjectIds?.[0]}/thumbnail`,
  collectionId: match.collectionHierarchy[0]?.id || 1,
  templateId: match.template.id,
}));

// Main sample asset (backwards compatibility with existing routes)
export const sampleAsset = mockAssets["687138947074c3fd4e03493a"];

// Export consolidated asset data for backwards compatibility
export const assetData = {
  sampleAsset,
  assetPreview: mockAssetPreviews[0],
  moreLikeThisResults: mockMoreLikeThisResults,
  userAssets: mockAssetSummaries,
};

// Export individual asset getter function
export const getAssetById = (assetId: string): Asset | undefined => {
  return mockAssets[assetId];
};

// Export file getter function
export const getFileData = (fileId: string) => {
  const fileMap: Record<string, FileDownloadNormalized> = {
    "file123": mockFiles.testDoc,
    "file124": mockFiles.sampleArchive, 
    "file125": mockFiles.historicPhoto,
    "file126": mockFiles.basicFile,
  };
  
  return fileMap[fileId];
};