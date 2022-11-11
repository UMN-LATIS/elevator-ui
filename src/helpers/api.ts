import axios from "axios";
import config from "@/config";
import { Asset, SearchResultMatch, Template, SearchResponse } from "@/types";
import { FileMetaData } from "@/types/FileMetaDataTypes";
import { FileDownloadResponse } from "@/types/FileDownloadTypes";

// caches for api results
const assets = new Map<string, Asset | null>();
const templates = new Map<string, Template | null>();
const searchMatches = new Map<string, SearchResultMatch[]>();
const fileMetaData = new Map<string, FileMetaData>();
const fileDownloadResponses = new Map<string, FileDownloadResponse>();

async function fetchAsset(assetId: string): Promise<Asset | null> {
  const res = await axios.get<Asset>(
    `${config.instance.base.url}/asset/viewAsset/${assetId}/true`
  );

  return res.data ?? null;
}

async function fetchTemplate(templateId: string): Promise<Template | null> {
  const res = await axios.get<Template>(
    `${config.instance.base.url}/assetManager/getTemplate/${templateId}`
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

  const res = await axios.post<SearchResponse>(
    `${config.instance.base.url}/search/searchResults`,
    formdata
  );

  // response may return asset within the search, so filter it out
  // if it does so that "more"
  return res.data.matches.filter((match) => match.objectId !== assetId);
}

async function fetchFileMetaData(fileId: string): Promise<FileMetaData> {
  const res = await axios.get<FileMetaData>(
    `${config.instance.base.url}/fileManager/getMetadataForObject/${fileId}`
  );

  return res.data;
}

async function fetchFileDownloadInfo(
  fileId: string,
  parentObjectId?: string | null
) {
  const res = await axios.get<FileDownloadResponse>(
    `${config.instance.base.url}/asset/getEmbedAsJson/${fileId}/${
      parentObjectId ?? ""
    }`
  );

  return res.data;
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
      searchMatches.get(assetId) || (await fetchMoreLikeThis(assetId));

    // cache matches
    searchMatches.set(assetId, matches);
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
  ) {
    if (!fileId) return null;

    const key = `${fileId}.${parentObjectId}`;
    const fileDownloadInfo =
      fileDownloadResponses.get(key) ||
      (await fetchFileDownloadInfo(fileId, parentObjectId));

    fileDownloadResponses.set(key, fileDownloadInfo);

    return fileDownloadInfo;
  },
};
