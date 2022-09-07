import { RelatedAssetCacheItem } from "@/types";

export function getTitleFromCacheItem(
  relatedAssetCacheItem: RelatedAssetCacheItem | null
): string {
  return relatedAssetCacheItem?.relatedAssetTitle?.[0] ?? "(No Title)";
}
