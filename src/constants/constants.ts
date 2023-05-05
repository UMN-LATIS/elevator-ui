import { LngLat } from "@/types";
import type { InjectionKey } from "vue";

export const UMN_LNGLAT: LngLat = {
  lat: 44.972109,
  lng: -93.24287,
};

export const TabsInjectionKey = Symbol("Tabs") as InjectionKey<string>;

// this is a constant so that we can use it in SearchResultsPage
// and the searchStore
export const SEARCH_RESULTS_VIEWS = [
  "grid",
  "list",
  "timeline",
  "map",
  "gallery",
] as const;

export const SORT_KEYS = {
  BEST_MATCH: 0,
  TITLE: "title.raw",
  LAST_MODIFIED_DESC: "lastModified.desc",
  LAST_MODIFIED_ASC: "lastModified.asc",
} as const;
