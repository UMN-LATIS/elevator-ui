import { InjectionKey, type Ref } from "vue";
import { LngLat } from "@/types";
import { Map, Marker } from "mapbox-gl";

export const getWidgetNestingDepthProviderKey = Symbol() as InjectionKey<
  () => number
>;

export const UMN_LNGLAT: LngLat = {
  lat: 44.972109,
  lng: -93.24287,
};

export const MAP_STYLES = {
  streets: "mapbox://styles/mapbox/streets-v11",
  outdoors: "mapbox://styles/mapbox/outdoors-v11",
  light: "mapbox://styles/mapbox/light-v10",
  dark: "mapbox://styles/mapbox/dark-v10",
  satellite: "mapbox://styles/mapbox/satellite-streets-v11",
  "navigation-day": "mapbox://styles/mapbox/navigation-day-v1",
  "navigation-night": "mapbox://styles/mapbox/navigation-night-v1",
};

export const MapInjectionKey: InjectionKey<Ref<Map>> = Symbol("MapboxGLMap");

export const MarkerInjectionKey: InjectionKey<Ref<Marker>> =
  Symbol("MapboxGLMarker");
