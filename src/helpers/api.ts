import axios from "axios";
import config from "@/config";
import { Asset, SearchResultMatch, Template, SearchResponse } from "@/types";

// caches for api results
const assets = new Map<string, Asset | null>();
const templates = new Map<string, Template | null>();
const searchMatches = new Map<string, SearchResultMatch[]>();

async function fetchAsset(assetId: string): Promise<Asset | null> {
  const res = await axios.get<Asset>(
    `${config.baseUrl}/asset/viewAsset/${assetId}/true`
  );

  return res.data ?? null;
}

async function fetchTemplate(templateId: string): Promise<Template | null> {
  const res = await axios.get<Template>(
    `${config.baseUrl}/assetManager/getTemplate/${templateId}`
  );
  return res.data ?? null;
}

async function fetchMoreLikeThis(
  assetId: string
): Promise<SearchResultMatch[]> {
  const formdata = new FormData();
  formdata.append("suppressRecent", "true");
  formdata.append("searchReleated", "true");
  formdata.append("searchQuery", JSON.stringify({ searchText: assetId }));

  const res = await axios.post<SearchResponse>(
    `${config.baseUrl}/search/searchResults`,
    formdata
  );

  return res.data.matches;
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
};
