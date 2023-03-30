import axios from "axios";
import { omit } from "ramda";
import config from "@/config";
import {
  Asset,
  SearchResultMatch,
  Template,
  SearchResultsResponse,
  ApiInterstitialResponse,
  ApiInstanceNavResponse,
  ApiStaticPageResponse,
  FileDownloadNormalized,
} from "@/types";
import { FileMetaData } from "@/types/FileMetaDataTypes";
import { FileDownloadResponse } from "@/types/FileDownloadTypes";
import { getExtensionFromFilename } from "@/helpers/getExtensionFromFilename";

const BASE_URL = config.instance.base.url;

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

async function fetchAsset(assetId: string): Promise<Asset | null> {
  const res = await axios.get<Asset>(
    `${BASE_URL}/asset/viewAsset/${assetId}/true`
  );

  return res.data ?? null;
}

async function fetchTemplate(templateId: string): Promise<Template | null> {
  const res = await axios.get<Template>(
    `${BASE_URL}/assetManager/getTemplate/${templateId}`
  );
  return res.data ?? null;
}

async function fetchMoreLikeThis(
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

async function fetchFileMetaData(fileId: string): Promise<FileMetaData> {
  const res = await axios.get<FileMetaData>(
    `${BASE_URL}/fileManager/getMetadataForObject/${fileId}`
  );

  return omit(["bulkMetadata"], res.data);
}

async function fetchFileDownloadInfo(
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

function fetchInterstitial() {
  return axios.get(`${BASE_URL}/home/interstitial`);
}

export default {
  async getAssetWithTemplate(
    assetId: string | null
  ): Promise<{ asset: Asset | null; template: Template | null }> {
    if (!assetId) {
      return { asset: null, template: null };
    }

    // load asset and cache it in the store
    const asset = assets.get(assetId) || (await fetchAsset(assetId));
    assets.set(assetId, asset);

    if (!asset) return { asset: null, template: null };

    // load template and cache it in the store
    const templateId = String(asset.templateId);
    const template =
      templates.get(templateId) || (await fetchTemplate(templateId));
    templates.set(templateId, template);

    return { asset, template };
  },
  async getMoreLikeThis(assetId: string | null): Promise<SearchResultMatch[]> {
    if (!assetId) return [];

    const matches =
      moreLikeThisMatches.get(assetId) || (await fetchMoreLikeThis(assetId));

    // cache matches
    moreLikeThisMatches.set(assetId, matches);
    return matches;
  },

  async getFileMetaData(fileId: string | null): Promise<FileMetaData | null> {
    if (!fileId) return null;

    const metadata =
      fileMetaData.get(fileId) || (await fetchFileMetaData(fileId));

    // cache metadata
    fileMetaData.set(fileId, metadata);
    return metadata;
  },

  async getFileDownloadInfo(
    fileId: string | null,
    parentObjectId?: string | null
  ): Promise<FileDownloadNormalized[] | null> {
    if (!fileId) return null;

    const key = `${fileId}.${parentObjectId}`;
    const fileDownloadInfo =
      fileDownloadResponses.get(key) ||
      (await fetchFileDownloadInfo(fileId, parentObjectId));

    fileDownloadResponses.set(key, fileDownloadInfo);

    return fileDownloadInfo;
  },

  async getEmbedPluginInterstitial(): Promise<ApiInterstitialResponse> {
    const res = await fetchInterstitial();
    return res.data;
  },

  async postLtiPayload({
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
  },
  async fetchInstanceNav(): Promise<ApiInstanceNavResponse> {
    const res = await axios.get<ApiInstanceNavResponse>(
      `${BASE_URL}/home/getInstanceNav`
    );
    return res.data;
  },

  async getSearchId(query: string): Promise<string> {
    const params = new URLSearchParams();
    params.append("searchText", query);

    // this param gets searchID without all the results
    params.append("storeOnly", "true");
    const res = await axios.post<SearchResultsResponse>(
      `${BASE_URL}/search/searchResults`,
      params
    );

    return res.data.searchId;
  },

  async getSearchResultsById(
    searchId: string,
    page = 0
  ): Promise<SearchResultsResponse> {
    // check the cache first
    const searchMap = paginatedSearchResults.get(searchId);
    if (searchMap && searchMap[page]) {
      return searchMap[page];
    }

    const res = await axios.get<SearchResultsResponse>(
      `${BASE_URL}/search/searchResults/${searchId}/${page}/false`
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
  },

  async getStaticPage(pageId: number): Promise<ApiStaticPageResponse> {
    const res = await axios.get(`${BASE_URL}/page/view/${pageId}/true`);
    return res.data;
  },

  async deleteAsset(assetId: string) {
    const res = await axios.get(
      `${BASE_URL}/assetManager/deleteAsset/${assetId}`
    );
    return res.data;
  },
};
