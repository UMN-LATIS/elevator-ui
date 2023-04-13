import { LngLat } from "@/types";
import type { InjectionKey } from "vue";

export const UMN_LNGLAT: LngLat = {
  lat: 44.972109,
  lng: -93.24287,
};

export const TabsInjectionKey = Symbol("Tabs") as InjectionKey<string>;

export const SEARCH_RESULTS_VIEWS = ["grid", "list"] as const;
