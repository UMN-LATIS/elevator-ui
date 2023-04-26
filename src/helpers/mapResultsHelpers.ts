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

        return {
          lng: locationEntry.loc.coordinates[0],
          lat: locationEntry.loc.coordinates[1],
        };
      });
    })
    .filter((lngLat): lngLat is LngLat => lngLat !== null);
}
