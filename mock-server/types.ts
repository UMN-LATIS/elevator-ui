// Local types for the mock server to avoid import issues from main app

export interface DateTime {
  date: string;
  timezone_type: number;
  timezone: string;
}

export interface TemplateEntry {
  id: number;
  name: string;
}

export interface RawAssetCollection {
  id: number;
  title: string;
  previewImageId?: string | null;
  children?: RawAssetCollection[];
}

export interface SearchResultMatch {
  title: string | string[] | null;
  dates: any[];
  locations: any[];
  objectId: string;
  lastModified?: string;
  collectionHierarchy: RawAssetCollection[];
  template: TemplateEntry;
}

export interface SearchEntry {
  collection?: string[];
  searchDate?: DateTime;
  searchText?: string;
  matchType?: string;
  showHidden?: boolean | "0" | "1";
  useBoolean?: boolean | "0" | "1";
  fuzzySearch?: "0" | "1";
  sort?: string;
  specificFieldSearch?: any[];
  combineSpecificSearches: "OR" | "AND";
}

export interface SearchResultsResponse {
  totalResults: number;
  matches: SearchResultMatch[];
  searchResults: string[];
  searchId: string;
  success?: boolean;
  sortableWidgets?: Record<string, string>;
  searchEntry?: SearchEntry;
}

export interface AssetSummary {
  objectId: string;
  title: string;
  readyForDisplay: boolean;
  templateId: number;
  modifiedDate: {
    date: string;
    timezone_type: number;
    timezone: string;
  };
}

export interface FileDownloadNormalized {
  filetype: string;
  isReady: boolean;
  url: string;
  originalFilename: string;
  extension: string;
}

export interface Asset {
  assetId: string;
  templateId: number;
  readyForDisplay: boolean;
  collectionId: number;
  availableAfter: any;
  modified: DateTime;
  modifiedBy: number | string;
  createdBy: number | string;
  deletedBy: number | string | null;
  relatedAssetCache: any;
  objectId: string;
  widgets: Record<string, any>;
  fileObjectIds?: string[];
}

// Form data interfaces for proper typing
export interface SearchFormData {
  searchQuery?: {
    searchText?: string;
  };
  storeOnly?: string;
  searchRelated?: string;
}

export interface DrawerFormData {
  objectId?: string;
  objectArray?: string[];
  drawerList?: string;
  label?: string;
  startTime?: string;
  endTime?: string;
  orderArray?: string[];
}

export interface FileFormData {
  checkArray?: string[];
}

export interface AssetFormData {
  objectId?: string;
  [key: string]: unknown;
}

export interface SessionData {
  userId: string;
  username: string;
  isAdmin?: boolean;
}

export interface MockServerContext {
  Variables: {
    session: SessionData | null;
    sessionId: string | undefined;
    sessions: Map<string, SessionData>;
  };
}