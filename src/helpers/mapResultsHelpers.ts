import { SearchResultMatch, LngLat } from "@/types";

export function convertSearchResultToLngLats(
  match: SearchResultMatch
): LngLat[] {
  if (!match.locations) return [];

  return match.locations
    .flatMap((location) => {
      if (!location.entries) return [];

      return location.entries.map((locationEntry) => {
        if (!locationEntry.loc) return null;

        const lng = locationEntry.loc.coordinates[0];
        const lat = locationEntry.loc.coordinates[1];
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;

        return { lng, lat };
      });
    })
    .filter((lngLat): lngLat is LngLat => lngLat !== null);
}
