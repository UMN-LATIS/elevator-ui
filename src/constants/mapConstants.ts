// until maplibre-gl this will import the entire library (~740k)
// so we break this into a separate file
// see: https://github.com/maplibre/maplibre-gl-js/issues/977

import { InjectionKey, type Ref } from "vue";
import { Map as MapLibreMap } from "maplibre-gl";
import { MarkerContext } from "@/types";

export const MapInjectionKey: InjectionKey<Ref<MapLibreMap | null>> =
  Symbol("MapLibreGLMap");

export const MarkerInjectionKey: InjectionKey<MarkerContext> =
  Symbol("MapLibreGLMarker");
