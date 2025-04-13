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
  ApiGetFieldInfoResponse,
  SearchableSpecificField,
  ApiListDrawersResponse,
  ApiGetDrawerResponse,
  WidgetProps,
  ApiCreateDrawerResponse,
  ApiAddAssetToDrawerResponse,
  ApiRemoveAssetFromDrawerResponse,
  CustomAxiosRequestConfig,
  DrawerSortOptions,
  ApiStartDrawerDownloadResponse,
  AssetExcerpt,
  ApiGetExcerptResponse,
  ApiSuccessResponse,
  CreateAssetRequestFormData,
  AssetSummary,
} from "@/types";
import { FileMetaData } from "@/types/FileMetaDataTypes";
import { FileDownloadResponse } from "@/types/FileDownloadTypes";
import { getExtensionFromFilename } from "@/helpers/getExtensionFromFilename";
import { ApiError } from "./ApiError";
import { useErrorStore } from "@/stores/errorStore";
import { toClickToSearchUrl } from "@/helpers/displayUtils";

const BASE_URL = config.instance.base.url;

axios.defaults.withCredentials = true;

// this interceptor is used to catch errors from the API
// convert them into API errors and store them in the error store
// so that they're displayed to the user
axios.interceptors.response.use(undefined, async (err: AxiosError) => {
  const customConfig = err.config as CustomAxiosRequestConfig;

  const errorStore = useErrorStore();
  let apiError: ApiError;

  if (err.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const data = (err.response.data as { message?: string }) ?? {};
    const message = data?.message ?? err.message;
    const statusCode = err.response.status;

    apiError = new ApiError(message, statusCode, data);
  } else {
    // Something happened in setting up the request that triggered an Error
    // This is likely a network error.
    apiError = new ApiError(err.message, 0); // Use 0 as the status code to signal a network error.
  }

  if (!customConfig.skipErrorNotifications) {
    // Add the ApiError to the errorStore
    errorStore.setError(apiError);
  }

  return Promise.reject(apiError);
});

export async function fetchAsset(assetId: string): Promise<Asset | null> {
  const res = await axios.get<Asset>(
    `${BASE_URL}/asset/viewAsset/${assetId}/true`
  );

  return res.data ?? null;
}

export async function fetchTemplate(
  templateId: string | number
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
    isDownloadable: downloadDetails.downloadable,
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

export async function fetchSearchIdForClickToSearch(
  linkText: string,
  widgetProps: WidgetProps
): Promise<string> {
  const url = toClickToSearchUrl(linkText, widgetProps);

  // add `/true` to the url to get the searchId as JSON
  const res = await axios.get<{ searchId: string }>(`${url}/true`);
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
  returnUrl,
}: {
  fileObjectId: string;
  returnUrl: string;
  excerptId: string;
}) {
  const formdata = new FormData();
  formdata.append("object", fileObjectId);
  formdata.append("excerptId", excerptId);
  formdata.append("returnUrl", returnUrl);

  const res = await axios.post(`${BASE_URL}/api/v1/lti/ltiPayload`, formdata);

  return res.data;
}

export async function postLtiPayload13({
  fileObjectId,
  excerptId,
  launchId,
  userId,
}: {
  fileObjectId: string;
  returnUrl: string;
  excerptId: string;
  launchId: string;
  userId: string;
}) {
  const formdata = new FormData();
  formdata.append("object", fileObjectId);
  formdata.append("excerptId", excerptId);
  formdata.append("launchId", launchId);
  formdata.append("userId", userId);

  const res = await axios.post(`${BASE_URL}/api/v1/lti13/ltiPayload`, formdata);

  return res.data;
}

export async function fetchSearchId(
  query: string,
  opts: Omit<SearchRequestOptions, "searchText"> = {}
): Promise<string> {
  const { collection, ...rest } = opts;
  const searchQuery: SearchRequestOptions = {
    searchText: query,
    ...rest,
  };

  // only add collection if it's defined
  if (collection) {
    searchQuery.collection = collection.map(String);
  }

  // only add sort if it's defined
  if (opts.sort) {
    searchQuery.sort = opts.sort;
  }

  const params = new URLSearchParams();
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
  opts: {
    page?: number;
    loadAll?: boolean;
  } = {}
) {
  const defaultOpts = {
    page: 0,
    loadAll: false,
  };

  const finalOpts = {
    ...defaultOpts,
    ...opts,
  };

  const res = await axios.get<SearchResultsResponse>(
    `${BASE_URL}/search/searchResults/${searchId}/${finalOpts.page}/${finalOpts.loadAll}`
  );

  const searchResults = res.data;
  return searchResults;
}

export async function deleteAsset(assetId: string) {
  const res = await axios.delete(
    `${BASE_URL}/assetManager/deleteAsset/${assetId}/true`
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
    // skip the error notification because we want to
    // handle it ourselves, so that a user
    // can be reprompted if their username/password
    // is incorrect
    const res = await axios.post<LocalLoginResponse>(
      `${BASE_URL}/loginManager/localLoginAsync`,
      formdata,
      { skipErrorNotifications: true } as CustomAxiosRequestConfig
    );

    return res.data;
  } catch (e: unknown) {
    const isBadCredentialsError = e instanceof ApiError && e.statusCode === 401;

    if (isBadCredentialsError) {
      return {
        status: "error",
        message: e.message,
      };
    }

    throw e;
  }
}

export async function fetchSearchableFieldInfo<T = ApiGetFieldInfoResponse>(
  field: SearchableSpecificField
) {
  const formdata = new FormData();
  formdata.append("fieldTitle", field.id);
  formdata.append("template", String(field.template));

  const res = await axios.post<T>(`${BASE_URL}/search/getFieldInfo`, formdata);

  return res.data;
}

export async function fetchDrawers(): Promise<ApiListDrawersResponse> {
  const res = await axios.get<ApiListDrawersResponse>(
    `${BASE_URL}/drawers/listDrawers/true`
  );

  return res.data;
}

export async function fetchDrawer(
  drawerId: number
): Promise<ApiGetDrawerResponse> {
  const res = await axios.get<ApiGetDrawerResponse>(
    `${BASE_URL}/drawers/getDrawer/${drawerId}`
  );

  return res.data;
}

export async function createDrawer(
  drawerTitle: string,
  customConfig: CustomAxiosRequestConfig = {}
) {
  const formdata = new FormData();
  formdata.append("drawerTitle", drawerTitle);

  const res = await axios.post<ApiCreateDrawerResponse>(
    `${BASE_URL}/drawers/addDrawer`,
    formdata,
    customConfig
  );

  return res.data;
}

export async function deleteDrawer(
  drawerId: number,
  customConfig: CustomAxiosRequestConfig = {}
) {
  const res = await axios.post(
    `${BASE_URL}/drawers/delete/${drawerId}/true`,
    undefined,
    customConfig
  );

  return res.data;
}

export async function addAssetToDrawer(
  assetId: string,
  drawerId: number,
  excerpt?: AssetExcerpt | null
) {
  const formdata = new FormData();
  formdata.append("objectId", assetId);
  formdata.append("drawerList", String(drawerId));

  if (excerpt) {
    formdata.append("label", excerpt.name);
    formdata.append("startTime", String(excerpt.startTime));
    formdata.append("endTime", String(excerpt.endTime));
    formdata.append("fileHandlerId", excerpt.fileHandlerId);
  }

  const res = await axios.post<ApiAddAssetToDrawerResponse>(
    `${BASE_URL}/drawers/addToDrawer/true`,
    formdata
  );
  return res.data;
}

export async function addAssetListToDrawer(
  assetIds: string[],
  drawerId: number
) {
  const formdata = new FormData();
  formdata.append("objectArray", JSON.stringify(assetIds));
  formdata.append("drawerList", String(drawerId));

  const res = await axios.post<ApiAddAssetToDrawerResponse>(
    `${BASE_URL}/drawers/addToDrawer/true`,
    formdata
  );
  return res.data;
}

export async function removeExcerptFromDrawer({
  drawerId,
  excerptId,
}: {
  drawerId: number;
  excerptId: number;
}) {
  const res = await axios.post<ApiSuccessResponse>(
    `${BASE_URL}/drawers/removeExcerpt/${drawerId}/${excerptId}/true`
  );
  return res.data;
}

export async function removeAssetFromDrawer({
  assetId,
  drawerId,
  excerptId,
}: {
  assetId: string;
  drawerId: number;
  excerptId?: number;
}) {
  if (excerptId) {
    return removeExcerptFromDrawer({ drawerId, excerptId });
  }

  const res = await axios.post<ApiRemoveAssetFromDrawerResponse>(
    `${BASE_URL}/drawers/removeFromDrawer/${drawerId}/${assetId}/true`
  );
  return res.data;
}

export async function setDrawerSortBy(
  drawerId: number,
  sortBy: DrawerSortOptions
) {
  const res = await axios.post(
    `${BASE_URL}/drawers/setSortOrder/${drawerId}/${sortBy}`
  );

  return res.data;
}

export async function setCustomDrawerOrder(
  drawerId: number,
  assetIds: string[]
) {
  const formdata = new FormData();
  formdata.append("orderArray", JSON.stringify(assetIds));

  const res = await axios.post(
    `${BASE_URL}/drawers/setCustomOrder/${drawerId}`,
    formdata
  );

  return res.data;
}

export async function startDrawerDownload(drawerId: number) {
  const res = await axios.post<ApiStartDrawerDownloadResponse>(
    `${BASE_URL}/drawers/downloadDrawer/${drawerId}/true`
  );
  return res.data;
}

export async function logout() {
  const res = await axios.post(`${BASE_URL}/loginManager/logout`);
  return res.data;
}

export async function fetchExcerpt(excerptId: number) {
  const res = await axios.get<ApiGetExcerptResponse>(
    `${BASE_URL}/asset/viewExcerpt/${excerptId}/true/true`
  );

  return res.data;
}

type FetchSuggestionsApiResponse = Record<string, string>;
export async function fetchDidYouMeanSuggestions(searchTerm: string) {
  const formdata = new FormData();
  formdata.append("searchTerm", searchTerm);

  const res = await axios.post<FetchSuggestionsApiResponse>(
    `${BASE_URL}/search/getSuggestion`,
    formdata
  );

  return res.data;
}

export async function createAsset(assetFormData: CreateAssetRequestFormData) {
  const formdata = new FormData();
  formdata.append("formData", JSON.stringify(assetFormData));

  const res = await axios.post<{
    objectId: string;
    success?: boolean;
  }>(`${BASE_URL}/assetManager/submission/true`, formdata);

  return res.data;
}

// update and create asset are the same endpoint
export const updateAsset = createAsset;

export async function fetchAllUserAssets() {
  const offset = 0;
  const returnJson = true;
  const res = await axios.get<AssetSummary[]>(
    `${BASE_URL}/assetManager/userAssets/${offset}/${returnJson}`
  );
  return res.data;
}
