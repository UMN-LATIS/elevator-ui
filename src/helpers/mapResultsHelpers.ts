import { SearchResultMatch, LngLat } from "@/types";
import { toLngLat } from "@/helpers/coordinates";

export function convertSearchResultToLngLats(
  match: SearchResultMatch
): LngLat[] {
  if (!match.locations) return [];

  return match.locations
    .flatMap((location) => {
      if (!location.entries) return [];

      return location.entries.map((locationEntry) =>
        toLngLat(locationEntry.loc?.coordinates)
      );
    })
    .filter((lngLat): lngLat is LngLat => lngLat !== null);
}
