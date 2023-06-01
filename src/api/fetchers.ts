/**
 * fetchers fetch latest data from an API and never cache results.
 * any caching should happen in API getters.
 */

import axios, { AxiosError } from "axios";
import { omit } from "ramda";
import config from "@/config";
import type {
  Asset,
  SearchResultMatch,
  Template,
  SearchResultsResponse,
  ApiStaticPageResponse,
  FileDownloadNormalized,
  ApiInstanceNavResponse,
  SearchRequestOptions,
  LocalLoginResponse,
  SearchableFieldFilter,
  ApiGetFieldInfoResponse,
  SearchableSelectField,
  SearchableField,
} from "@/types";
import { FileMetaData } from "@/types/FileMetaDataTypes";
import { FileDownloadResponse } from "@/types/FileDownloadTypes";
import { getExtensionFromFilename } from "@/helpers/getExtensionFromFilename";

const BASE_URL = config.instance.base.url;

axios.defaults.withCredentials = true;

export async function fetchAsset(assetId: string): Promise<Asset | null> {
  const res = await axios.get<Asset>(
    `${BASE_URL}/asset/viewAsset/${assetId}/true`
  );

  return res.data ?? null;
}

export async function fetchTemplate(
  templateId: string
): Promise<Template | null> {
  const res = await axios.get<Template>(
    `${BASE_URL}/assetManager/getTemplate/${templateId}`
  );
  return res.data ?? null;
}

export async function fetchMoreLikeThis(
  assetId: string
): Promise<SearchResultMatch[]> {
  const formdata = new FormData();
  formdata.append("suppressRecent", "true");
  formdata.append("searchRelated", "true");
  formdata.append("searchQuery", JSON.stringify({ searchText: assetId }));

  const res = await axios.post<SearchResultsResponse>(
    `${BASE_URL}/search/searchResults`,
    formdata
  );

  // response may return asset within the search, so filter it out
  // if it does so that "more"
  return res.data.matches.filter((match) => match.objectId !== assetId);
}

export async function fetchCollectionDescription(
  collectionId: number
): Promise<string | null> {
  const res = await axios.get<{
    collectionDescription: string;
    collectionTitle: string;
  }>(`${BASE_URL}/collections/collectionHeader/${collectionId}/true`);

  return res.data.collectionDescription ?? null;
}

export async function fetchFileMetaData(fileId: string): Promise<FileMetaData> {
  const res = await axios.get<FileMetaData>(
    `${BASE_URL}/fileManager/getMetadataForObject/${fileId}`
  );

  return omit(["bulkMetadata"], res.data);
}

export async function fetchFileDownloadInfo(
  fileId: string,
  parentObjectId?: string | null
): Promise<FileDownloadNormalized[]> {
  const res = await axios.get<FileDownloadResponse>(
    `${BASE_URL}/asset/getEmbedAsJson/${fileId}/${parentObjectId ?? ""}`
  );

  return Object.entries(res.data).map(([filetype, downloadDetails]) => ({
    filetype,
    isReady: downloadDetails.ready,
    url:
      filetype === "original"
        ? `${BASE_URL}/fileManager/getOriginal/${fileId}`
        : `${BASE_URL}/fileManager/getDerivativeById/${fileId}/${filetype}`,
    originalFilename: downloadDetails.originalFilename,
    extension: getExtensionFromFilename(downloadDetails.originalFilename),
  }));
}

export async function fetchInterstitial() {
  return axios.get(`${BASE_URL}/home/interstitial`);
}

export async function fetchSearchIdForCollection(
  collectionId: number
): Promise<string> {
  const params = new URLSearchParams();
  params.append("searchText", "");
  params.append("collectionId", String(collectionId));

  // this param gets searchID without all the results
  params.append("storeOnly", "true");
  const res = await axios.post<SearchResultsResponse>(
    `${BASE_URL}/search/searchResults`,
    params
  );

  return res.data.searchId;
}

export async function fetchStaticPage(
  pageId: number
): Promise<ApiStaticPageResponse> {
  const res = await axios.get(`${BASE_URL}/page/view/${pageId}/true`);
  return res.data;
}

export async function fetchInstanceNav(): Promise<ApiInstanceNavResponse> {
  const res = await axios.get<ApiInstanceNavResponse>(
    `${BASE_URL}/home/getInstanceNav`
  );

  return res.data;
}

export async function postLtiPayload({
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

export async function fetchSearchId(
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

export async function fetchSearchResultsById(
  searchId: string,
  page: number,
  loadAll: boolean
) {
  const res = await axios.get<SearchResultsResponse>(
    `${BASE_URL}/search/searchResults/${searchId}/${page}/${loadAll}`
  );

  const searchResults = res.data;
  return searchResults;
}

export async function deleteAsset(assetId: string) {
  const res = await axios.get(
    `${BASE_URL}/assetManager/deleteAsset/${assetId}`
  );
  return res.data;
}

export async function loginAsGuest({
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

export async function fetchSearchableFieldInfo<T = ApiGetFieldInfoResponse>(
  field: SearchableField
) {
  const formdata = new FormData();
  formdata.append("fieldTitle", field.id);
  formdata.append("template", String(field.template));

  const res = await axios.post<T>(`${BASE_URL}/search/getFieldInfo`, formdata);

  return res.data;
}