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
  ApiAddAssetToDrawerResponse,
  ApiRemoveAssetFromDrawerResponse,
  ApiCreateDrawerResponse,
  CustomAxiosRequestConfig,
  DrawerSortOptions,
  ApiGetExcerptResponse,
  AssetExcerpt,
} from "@/types";
import { FileMetaData } from "@/types/FileMetaDataTypes";
import * as fetchers from "@/api/fetchers";

function createCache() {
  return {
    assets: new Map<string, Asset | null>(),
    templates: new Map<string, Template | null>(),
    excerpts: new Map<number, ApiGetExcerptResponse | null>(),
    moreLikeThisMatches: new Map<string, SearchResultMatch[]>(),
    fileMetaData: new Map<string, FileMetaData>(),
    fileDownloadResponses: new Map<string, FileDownloadNormalized[]>(),
    paginatedSearchResults: new Map<
      string,
      Record<number, SearchResultsResponse>
    >(),
    collectionDescriptions: new Map<number, string | null>(),
    collectionSearchIds: new Map<number, string | null>(),
    staticPages: new Map<number, ApiStaticPageResponse | null>(),
    searchableFieldDetails: new Map<string, ApiGetFieldInfoResponse>(),
    drawerDetails: new Map<number, ApiGetDrawerResponse | null>(),
    listOfDrawers: null as null | Drawer[],
  };
}

let cache = createCache();

export function clearCache() {
  cache = createCache();
}

async function getAsset(assetId: string): Promise<Asset | null> {
  if (!assetId) return null;

  // load asset and cache it in the store
  const asset =
    cache.assets.get(assetId) || (await fetchers.fetchAsset(assetId));
  cache.assets.set(assetId, asset);

  return asset;
}

async function getAssetWithTemplate(
  assetId: string | null
): Promise<{ asset: Asset | null; template: Template | null }> {
  if (!assetId) {
    return { asset: null, template: null };
  }

  // load asset and cache it in the store
  const asset =
    cache.assets.get(assetId) || (await fetchers.fetchAsset(assetId));
  cache.assets.set(assetId, asset);

  if (!asset) return { asset: null, template: null };

  // load template and cache it in the store
  const templateId = String(asset.templateId);
  const template =
    cache.templates.get(templateId) ||
    (await fetchers.fetchTemplate(templateId));
  cache.templates.set(templateId, template);

  return { asset, template };
}

async function getCollectionDescription(id: number): Promise<string | null> {
  const description =
    cache.collectionDescriptions.get(id) ||
    (await fetchers.fetchCollectionDescription(id));

  cache.collectionDescriptions.set(id, description);

  return description;
}

async function getMoreLikeThis(
  assetId: string | null
): Promise<SearchResultMatch[]> {
  if (!assetId) return [];

  const matches =
    cache.moreLikeThisMatches.get(assetId) ||
    (await fetchers.fetchMoreLikeThis(assetId));

  // cache matches
  cache.moreLikeThisMatches.set(assetId, matches);
  return matches;
}

async function getFileMetaData(
  fileId: string | null
): Promise<FileMetaData | null> {
  if (!fileId) return null;

  const metadata =
    cache.fileMetaData.get(fileId) ||
    (await fetchers.fetchFileMetaData(fileId));

  // cache metadata
  cache.fileMetaData.set(fileId, metadata);
  return metadata;
}

async function getFileDownloadInfo(
  fileId: string | null,
  parentObjectId?: string | null
): Promise<FileDownloadNormalized[] | null> {
  if (!fileId) return null;

  const key = `${fileId}.${parentObjectId}`;
  const fileDownloadInfo =
    cache.fileDownloadResponses.get(key) ||
    (await fetchers.fetchFileDownloadInfo(fileId, parentObjectId));

  cache.fileDownloadResponses.set(key, fileDownloadInfo);

  return fileDownloadInfo;
}

async function getEmbedPluginInterstitial(): Promise<ApiInterstitialResponse> {
  const res = await fetchers.fetchInterstitial();
  return res.data;
}

async function getSearchIdForCollection(collectionId: number): Promise<string> {
  // check the cache first before making the request
  const searchId =
    cache.collectionSearchIds.get(collectionId) ||
    (await fetchers.fetchSearchIdForCollection(collectionId));

  // update cache
  cache.collectionSearchIds.set(collectionId, searchId);

  // return the searchId
  return searchId;
}

async function getSearchResultsById(
  searchId: string,
  page = 0,
  loadAll = false
): Promise<SearchResultsResponse> {
  // check the cache first
  const searchMap = cache.paginatedSearchResults.get(searchId);
  if (searchMap && searchMap[page]) {
    return searchMap[page];
  }

  const searchResults = await fetchers.fetchSearchResultsById(
    searchId,
    page,
    loadAll
  );

  // cache the results
  cache.paginatedSearchResults.set(searchId, {
    ...(searchMap || {}), // add to existing cache if it exists
    [page]: searchResults,
  });
  return searchResults;
}

async function getStaticPage(pageId: number): Promise<ApiStaticPageResponse> {
  // check the cache first
  const page =
    cache.staticPages.get(pageId) || (await fetchers.fetchStaticPage(pageId));

  // cache the page
  cache.staticPages.set(pageId, page);

  return page;
}

async function getSearchableFieldInfo<T extends ApiGetFieldInfoResponse>(
  field: SearchableSpecificField
): Promise<T | null> {
  const fieldKey = `${field.id}-${field.template}`;

  // return cached data if it exists
  if (cache.searchableFieldDetails.has(fieldKey)) {
    const cachedResponse = cache.searchableFieldDetails.get(fieldKey) as T;
    return cachedResponse ?? null;
  }

  // otherwise get the data
  const data = await fetchers.fetchSearchableFieldInfo<T>(field);

  // cache the response
  cache.searchableFieldDetails.set(fieldKey, data);

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

async function getDrawers({
  refresh = false,
}: {
  refresh?: boolean;
} = {}): Promise<Drawer[]> {
  // return cached data if it exists
  if (cache.listOfDrawers && !refresh) {
    return cache.listOfDrawers;
  }

  // otherwise fetch it
  const data = await fetchers.fetchDrawers();

  // the data is an object, so we need to convert it to an array
  // and add the key as the id
  cache.listOfDrawers = Object.entries(data)
    .map(([key, value]) => ({
      id: Number.parseInt(key),
      ...value,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  return cache.listOfDrawers;
}

export async function getDrawer(id: number): Promise<Drawer> {
  const data = cache.drawerDetails.get(id) ?? (await fetchers.fetchDrawer(id));

  // cache the response
  cache.drawerDetails.set(id, data);

  const { drawerId, drawerTitle, ...contents } = data;

  return {
    id: drawerId,
    title: drawerTitle,
    contents,
  };
}

export async function addAssetToDrawer(
  assetId: string,
  drawerId: number,
  excerpt?: AssetExcerpt | null
): Promise<ApiAddAssetToDrawerResponse> {
  const data = await fetchers.addAssetToDrawer(assetId, drawerId, excerpt);

  // clear the cache for this drawer
  cache.drawerDetails.delete(drawerId);

  return data;
}

export async function addAssetListToDrawer(
  assetIds: string[],
  drawerId: number
): Promise<ApiAddAssetToDrawerResponse> {
  const data = await fetchers.addAssetListToDrawer(assetIds, drawerId);

  // clear the cache for this drawer
  cache.drawerDetails.delete(drawerId);

  return data;
}

export async function removeExcerptFromDrawer({
  excerptId,
  drawerId,
}: {
  excerptId: number;
  drawerId: number;
}): Promise<ApiRemoveAssetFromDrawerResponse> {
  const data = await fetchers.removeExcerptFromDrawer({ drawerId, excerptId });

  // clear the cache for this drawer
  cache.drawerDetails.delete(drawerId);

  return data;
}

export async function removeAssetFromDrawer({
  assetId,
  drawerId,
}: {
  assetId: string;
  drawerId: number;
}): Promise<ApiRemoveAssetFromDrawerResponse> {
  const data = await fetchers.removeAssetFromDrawer({ drawerId, assetId });

  // clear the cache for this drawer
  cache.drawerDetails.delete(drawerId);

  return data;
}

export async function createDrawer(
  drawerTitle: string,
  customConfig: CustomAxiosRequestConfig = {}
): Promise<ApiCreateDrawerResponse> {
  const data = await fetchers.createDrawer(drawerTitle, customConfig);

  // clear the list of drawers cache
  cache.listOfDrawers = null;

  return data;
}

export async function deleteDrawer(
  drawerId: number,
  customConfig: CustomAxiosRequestConfig = {}
): Promise<unknown> {
  const data = await fetchers.deleteDrawer(drawerId, customConfig);

  // clear the list of drawers cache
  cache.listOfDrawers = null;

  return data;
}

export async function setDrawerSortBy(
  drawerId: number,
  sortBy: DrawerSortOptions
) {
  const data = await fetchers.setDrawerSortBy(drawerId, sortBy);

  // clear the drawer cache
  cache.drawerDetails.delete(drawerId);

  return data;
}

export async function setCustomDrawerOrder(
  drawerId: number,
  assetIds: string[]
) {
  const data = await fetchers.setCustomDrawerOrder(drawerId, assetIds);

  // clear the drawer cache
  cache.drawerDetails.delete(drawerId);

  return data;
}

export async function getExcerpt(excerptId: number) {
  const data =
    cache.excerpts.get(excerptId) ?? (await fetchers.fetchExcerpt(excerptId));

  // cache the response
  cache.excerpts.set(excerptId, data);

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
  getExcerpt,
  postLtiPayload: fetchers.postLtiPayload,
  fetchInstanceNav: fetchers.fetchInstanceNav,
  getSearchId: fetchers.fetchSearchId,
  getSearchIdForCollection,
  getSearchIdForClickToSearch: fetchers.fetchSearchIdForClickToSearch,
  getSearchResultsById,
  getStaticPage,
  deleteAsset: fetchers.deleteAsset,
  loginAsGuest: fetchers.loginAsGuest,
  logout: fetchers.logout,
  getSearchableSelectFieldValues,
  getSearchableCheckboxFieldValues,
  getSearchableMultiSelectFieldValues,
  getDrawers,
  getDrawer,
  createDrawer,
  deleteDrawer,
  addAssetToDrawer,
  addAssetListToDrawer,
  removeAssetFromDrawer,
  removeExcerptFromDrawer,
  setDrawerSortBy,
  setCustomDrawerOrder,
  startDrawerDownload: fetchers.startDrawerDownload,
  clearCache,
};

export default api;
