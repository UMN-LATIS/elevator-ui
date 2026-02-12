import { Asset, LngLat } from "@/types";
import type { InjectionKey, ComputedRef } from "vue";
import { useAssetEditor } from "@/pages/CreateOrEditAssetPage/useAssetEditor/useAssetEditor";
import { useAssetValidationProvider } from "@/pages/CreateOrEditAssetPage/useAssetEditor/useAssetValidation";

export const ALL_THEMES = [
  "light",
  "folwell",
  "st-thomas",
  "dark",
  "hotdog",
] as const;

export const UMN_LNGLAT: LngLat = {
  lat: 44.972109,
  lng: -93.24287,
};

export const TabsInjectionKey = Symbol("Tabs") as InjectionKey<string>;
export const IsModalOpenKey = Symbol() as InjectionKey<ComputedRef<boolean>>;

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

// custom elevator events that custom header/footer scripts can listen for
export const ELEVATOR_EVENTS = {
  STATIC_CONTENT_PAGE: {
    CONTENT_LOADED: "elevator:static-content-page:content-loaded",
    IMAGES_LOADED: "elevator:static-content-page:images-loaded",
  },
} as const;

// these are ids for searchable fields that don't actually exist
// in the api, but we want to treat them like they do for the sake
// of the UI
export const GLOBAL_FIELD_IDS = {
  DATE_RANGE: "GLOBAL_DATE_RANGE",
  LOCATION: "GLOBAL_LOCATION",
  FILE_TYPE: "GLOBAL_FILE_TYPE",
} as const;

export const TEMPLATE_SHOW_PROPERTY_POSITIONS = {
  BOTTOM: 0,
  TOP: 1,
} as const;

export const SAVE_RELATED_ASSET_TYPE = "SAVE_RELATED_ASSET_MESSAGE" as const;

export const ASSET_EDITOR_PROVIDE_KEY = Symbol() as InjectionKey<
  ReturnType<typeof useAssetEditor>
>;

export const ASSET_VALIDATION_PROVIDE_KEY = Symbol() as InjectionKey<
  ReturnType<typeof useAssetValidationProvider>
>;

export const PAGE_ASSET_ID = Symbol() as InjectionKey<
  ComputedRef<Asset["assetId"] | null>
>;
