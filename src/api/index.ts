import axios, { AxiosError } from "axios";
import config from "@/config";
import {
  Asset,
  SearchResultMatch,
  Template,
  SearchResultsResponse,
  ApiInterstitialResponse,
  ApiStaticPageResponse,
  FileDownloadNormalized,
  LocalLoginResponse,
  SearchRequestOptions,
} from "@/types";
import { FileMetaData } from "@/types/FileMetaDataTypes";
import * as fetchers from "@/api/fetchers";

const BASE_URL = config.instance.base.url;

axios.defaults.withCredentials = true;

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

async function postLtiPayload({
  fileObjectId,
  excerptId,
}: {
  fileObjectId: string;
  returnUrl: string;
  excerptId: string;
}) {
  const formdata = new FormData();
  formdata.append("object", fileObjectId);
  formdata.append("excerptId", excerptId);

  const res = await axios.post(`${BASE_URL}/api/v1/lti/ltiPayload`, formdata);

  return res.data;
}

async function getSearchId(
  query: string,
  opts: Omit<SearchRequestOptions, "searchText"> = {}
): Promise<string> {
  const params = new URLSearchParams();
  const searchQuery: SearchRequestOptions = { searchText: query };

  if (opts.sort) {
    searchQuery.sort = opts.sort;
  }

  if (opts.collection) {
    searchQuery.collection = opts.collection.map(String);
  }

  if (opts.specificFieldSearch) {
    searchQuery.specificFieldSearch = opts.specificFieldSearch;

    // default to OR combine operator
    searchQuery.combineSpecificSearches = opts.combineSpecificSearches ?? "OR";
  }

  params.append("searchQuery", JSON.stringify(searchQuery));

  // this param gets searchID without all the results
  params.append("storeOnly", "true");
  const res = await axios.post<SearchResultsResponse>(
    `${BASE_URL}/search/searchResults`,
    params
  );

  return res.data.searchId;
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

  const res = await axios.get<SearchResultsResponse>(
    `${BASE_URL}/search/searchResults/${searchId}/${page}/${loadAll}`
  );

  const searchResults = res.data;

  // cache the results
  // if the searchId is not in the cache, add it
  if (!searchMap) {
    paginatedSearchResults.set(searchId, {
      [page]: searchResults,
    });
    return searchResults;
  }

  // if the searchId is in the cache, add the page to it
  paginatedSearchResults.set(searchId, {
    ...searchMap,
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

async function deleteAsset(assetId: string) {
  const res = await axios.get(
    `${BASE_URL}/assetManager/deleteAsset/${assetId}`
  );
  return res.data;
}

async function loginAsGuest({
  username,
  password,
}: {
  username: string;
  password: string;
}): Promise<LocalLoginResponse> {
  const formdata = new FormData();
  formdata.append("username", username);
  formdata.append("password", password);

  try {
    const res = await axios.post<LocalLoginResponse>(
      `${BASE_URL}/loginManager/localLoginAsync`,
      formdata
    );

    return res.data;
  } catch (e: unknown) {
    if (!(e instanceof AxiosError)) {
      throw e;
    }

    if (e.response?.status === 401) {
      return e.response.data;
    }

    console.error(e.response?.data);
    throw e;
  }
}

const api = {
  getAsset,
  getAssetWithTemplate,
  getCollectionDescription,
  getMoreLikeThis,
  getFileMetaData,
  getFileDownloadInfo,
  getEmbedPluginInterstitial,
  postLtiPayload,
  fetchInstanceNav: fetchers.fetchInstanceNav,
  getSearchId,
  getSearchIdForCollection,
  getSearchResultsById,
  getStaticPage,
  deleteAsset,
  loginAsGuest,
};

export default api;
