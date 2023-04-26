import { describe, expect, it } from "@jest/globals";
import { convertSearchResultToLngLats } from "./mapResultsHelpers";
import { SearchResultMatch } from "@/types";

describe("mapResultsHelpers", () => {
  describe("convertSearchResultToLngLats", () => {
    it("returns empty array if no locations", () => {
      const result = convertSearchResultToLngLats({} as SearchResultMatch);
      expect(result).toEqual([]);
    });
    it("returns lnglat for each entry of each location", () => {
      const match: Partial<SearchResultMatch> = {
        locations: [
          {
            label: "Location 1",
            entries: [
              {
                loc: {
                  type: "Point",
                  coordinates: [1, 2],
                },
              },
              {
                loc: {
                  type: "Point",
                  coordinates: [3, 4],
                },
              },
            ],
          },
          {
            label: "Location 2",
            entries: [
              {
                loc: {
                  type: "Point",
                  coordinates: [5, 6],
                },
              },
              {
                loc: {
                  type: "Point",
                  coordinates: [7, 8],
                },
              },
            ],
          },
        ],
      };
      const result = convertSearchResultToLngLats(match as SearchResultMatch);
      expect(result).toEqual([
        { lng: 1, lat: 2 },
        { lng: 3, lat: 4 },
        { lng: 5, lat: 6 },
        { lng: 7, lat: 8 },
      ]);
    });
  });
});
