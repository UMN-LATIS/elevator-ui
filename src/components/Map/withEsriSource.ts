import { TiledMapService } from "mapbox-gl-esri-sources";
import { Map as MapLibreMap } from "maplibre-gl";

export const withEsriSource =
  ({ url }: { url: string }) =>
  (map: MapLibreMap) => {
    map.on("load", () => {
      new TiledMapService("imagery-source", map, { url });

      // And then add it as a layer to your map
      map.addLayer({
        id: "imagery-layer",
        type: "raster",
        source: "imagery-source",
      });
    });

    return map;
  };
