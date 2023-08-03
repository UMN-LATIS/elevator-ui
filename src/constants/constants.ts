import { LngLat } from "@/types";
import type { InjectionKey, Ref } from "vue";

export const UMN_LNGLAT: LngLat = {
  lat: 44.972109,
  lng: -93.24287,
};

export const TabsInjectionKey = Symbol("Tabs") as InjectionKey<string>;
export const AddToDrawerIsModelOpenKey = Symbol() as InjectionKey<Ref<boolean>>;

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
  CUSTOM: "custom",
} as const;

// these are ids for searchable fields that don't actually exist
// in the api, but we want to treat them like they do for the sake
// of the UI
export const GLOBAL_FIELD_IDS = {
  DATE_RANGE: "GLOBAL_DATE_RANGE",
  LOCATION: "GLOBAL_LOCATION",
  FILE_TYPE: "GLOBAL_FILE_TYPE",
} as const;
