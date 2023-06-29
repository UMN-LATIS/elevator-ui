import {
  Asset,
  SearchResultMatch,
  Template,
  SearchResultsResponse,
  ApiInterstitialResponse,
  ApiStaticPageResponse,
  FileDownloadNormalized,
  ApiGetFieldInfoResponse,
  ApiGetSelectFieldInfoResponse,
  ApiGetCheckboxFieldInfoResponse,
  ApiGetMultiSelectFieldInfoResponse,
  SearchableSpecificField,
  SearchableSelectField,
  SearchableCheckboxField,
  SearchableMultiSelectField,
  TreeNode,
  Drawer,
  ApiGetDrawerResponse,
} from "@/types";
import { FileMetaData } from "@/types/FileMetaDataTypes";
import * as fetchers from "@/api/fetchers";

// caches for api results
const assets = new Map<string, Asset | null>();
const templates = new Map<string, Template | null>();
const moreLikeThisMatches = new Map<string, SearchResultMatch[]>();
const fileMetaData = new Map<string, FileMetaData>();
const fileDownloadResponses = new Map<string, FileDownloadNormalized[]>();
const paginatedSearchResults = new Map<
  string,
  Record<number, SearchResultsResponse>
>();
const collectionDescriptions = new Map<number, string | null>();
const collectionSearchIds = new Map<number, string | null>();
const staticPages = new Map<number, ApiStaticPageResponse | null>();
const searchableFieldDetails = new Map<string, ApiGetFieldInfoResponse>();
const drawerDetails = new Map<number, ApiGetDrawerResponse | null>();

async function getAsset(assetId: string): Promise<Asset | null> {
  if (!assetId) return null;

  // load asset and cache it in the store
  const asset = assets.get(assetId) || (await fetchers.fetchAsset(assetId));
  assets.set(assetId, asset);

  return asset;
}

async function getAssetWithTemplate(
  assetId: string | null
): Promise<{ asset: Asset | null; template: Template | null }> {
  if (!assetId) {
    return { asset: null, template: null };
  }

  // load asset and cache it in the store
  const asset = assets.get(assetId) || (await fetchers.fetchAsset(assetId));
  assets.set(assetId, asset);

  if (!asset) return { asset: null, template: null };

  // load template and cache it in the store
  const templateId = String(asset.templateId);
  const template =
    templates.get(templateId) || (await fetchers.fetchTemplate(templateId));
  templates.set(templateId, template);

  return { asset, template };
}

async function getCollectionDescription(id: number): Promise<string | null> {
  const description =
    collectionDescriptions.get(id) ||
    (await fetchers.fetchCollectionDescription(id));

  collectionDescriptions.set(id, description);

  return description;
}

async function getMoreLikeThis(
  assetId: string | null
): Promise<SearchResultMatch[]> {
  if (!assetId) return [];

  const matches =
    moreLikeThisMatches.get(assetId) ||
    (await fetchers.fetchMoreLikeThis(assetId));

  // cache matches
  moreLikeThisMatches.set(assetId, matches);
  return matches;
}

async function getFileMetaData(
  fileId: string | null
): Promise<FileMetaData | null> {
  if (!fileId) return null;

  const metadata =
    fileMetaData.get(fileId) || (await fetchers.fetchFileMetaData(fileId));

  // cache metadata
  fileMetaData.set(fileId, metadata);
  return metadata;
}

async function getFileDownloadInfo(
  fileId: string | null,
  parentObjectId?: string | null
): Promise<FileDownloadNormalized[] | null> {
  if (!fileId) return null;

  const key = `${fileId}.${parentObjectId}`;
  const fileDownloadInfo =
    fileDownloadResponses.get(key) ||
    (await fetchers.fetchFileDownloadInfo(fileId, parentObjectId));

  fileDownloadResponses.set(key, fileDownloadInfo);

  return fileDownloadInfo;
}

async function getEmbedPluginInterstitial(): Promise<ApiInterstitialResponse> {
  const res = await fetchers.fetchInterstitial();
  return res.data;
}

async function getSearchIdForCollection(collectionId: number): Promise<string> {
  // check the cache first before making the request
  const searchId =
    collectionSearchIds.get(collectionId) ||
    (await fetchers.fetchSearchIdForCollection(collectionId));

  // update cache
  collectionSearchIds.set(collectionId, searchId);

  // return the searchId
  return searchId;
}

async function getSearchResultsById(
  searchId: string,
  page = 0,
  loadAll = false
): Promise<SearchResultsResponse> {
  // check the cache first
  const searchMap = paginatedSearchResults.get(searchId);
  if (searchMap && searchMap[page]) {
    return searchMap[page];
  }

  const searchResults = await fetchers.fetchSearchResultsById(
    searchId,
    page,
    loadAll
  );

  // cache the results
  paginatedSearchResults.set(searchId, {
    ...(searchMap || {}), // add to existing cache if it exists
    [page]: searchResults,
  });
  return searchResults;
}

async function getStaticPage(pageId: number): Promise<ApiStaticPageResponse> {
  // check the cache first
  const page =
    staticPages.get(pageId) || (await fetchers.fetchStaticPage(pageId));

  // cache the page
  staticPages.set(pageId, page);

  return page;
}

async function getSearchableFieldInfo<T extends ApiGetFieldInfoResponse>(
  field: SearchableSpecificField
): Promise<T | null> {
  const fieldKey = `${field.id}-${field.template}`;

  // return cached data if it exists
  if (searchableFieldDetails.has(fieldKey)) {
    const cachedResponse = searchableFieldDetails.get(fieldKey) as T;
    return cachedResponse ?? null;
  }

  // otherwise get the data
  const data = await fetchers.fetchSearchableFieldInfo<T>(field);

  // cache the response
  searchableFieldDetails.set(fieldKey, data);

  // and return the values
  return data;
}

async function getSearchableSelectFieldValues(
  field: SearchableSelectField
): Promise<string[]> {
  const data = await getSearchableFieldInfo<ApiGetSelectFieldInfoResponse>(
    field
  );

  return data?.values ?? [];
}

async function getSearchableCheckboxFieldValues(
  field: SearchableCheckboxField
): Promise<{
  boolean_true: string;
  boolean_false: string;
}> {
  const data = await getSearchableFieldInfo<ApiGetCheckboxFieldInfoResponse>(
    field
  );

  return (
    data?.values ?? {
      boolean_true: "checked",
      boolean_false: "unchecked",
    }
  );
}

async function getSearchableMultiSelectFieldValues(
  field: SearchableMultiSelectField
): Promise<TreeNode> {
  const data = await getSearchableFieldInfo<ApiGetMultiSelectFieldInfoResponse>(
    field
  );

  return data?.rawContent ?? {};
}

let listOfDrawers: null | Drawer[] = null;
async function getDrawers({
  refresh = false,
}: {
  refresh?: boolean;
} = {}): Promise<Drawer[]> {
  // return cached data if it exists
  if (listOfDrawers && !refresh) {
    return listOfDrawers;
  }

  // otherwise fetch it
  const data = await fetchers.fetchDrawers();

  // the data is an object, so we need to convert it to an array
  // and add the key as the id
  listOfDrawers = Object.entries(data)
    .map(([key, value]) => ({
      id: Number.parseInt(key),
      ...value,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  return listOfDrawers;
}

export async function getDrawer(id: number): Promise<ApiGetDrawerResponse> {
  const data = drawerDetails.get(id) ?? (await fetchers.fetchDrawer(id));

  // cache the response
  drawerDetails.set(id, data);

  return data;
}

const api = {
  getAsset,
  getAssetWithTemplate,
  getCollectionDescription,
  getMoreLikeThis,
  getFileMetaData,
  getFileDownloadInfo,
  getEmbedPluginInterstitial,
  postLtiPayload: fetchers.postLtiPayload,
  fetchInstanceNav: fetchers.fetchInstanceNav,
  getSearchId: fetchers.fetchSearchId,
  getSearchIdForCollection,
  getSearchIdForClickToSearch: fetchers.fetchSearchIdForClickToSearch,
  getSearchResultsById,
  getStaticPage,
  deleteAsset: fetchers.deleteAsset,
  loginAsGuest: fetchers.loginAsGuest,
  getSearchableSelectFieldValues,
  getSearchableCheckboxFieldValues,
  getSearchableMultiSelectFieldValues,
  getDrawers,
  getDrawer,
  createDrawer: fetchers.createDrawer,
  deleteDrawer: fetchers.deleteDrawer,
};

export default api;
