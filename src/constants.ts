import { InjectionKey, type Ref } from "vue";
import { LngLat } from "@/types";
import { Map as MapLibreMap, Marker } from "maplibre-gl";

export const getWidgetNestingDepthProviderKey = Symbol() as InjectionKey<
  () => number
>;

export const UMN_LNGLAT: LngLat = {
  lat: 44.972109,
  lng: -93.24287,
};

export const MapInjectionKey: InjectionKey<Ref<MapLibreMap>> =
  Symbol("MapLibreGLMap");

export const MarkerInjectionKey: InjectionKey<Ref<Marker>> =
  Symbol("MapLibreGLMarker");
