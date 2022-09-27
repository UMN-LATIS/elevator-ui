import { TiledMapService } from "mapbox-gl-esri-sources";
import { Map as MapLibreMap } from "maplibre-gl";

export const withEsriSource = () => (map: MapLibreMap) => {
  new TiledMapService("imagery-source", map, {
    url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
  });

  // And then add it as a layer to your map
  map.addLayer({
    id: "imagery-layer",
    type: "raster",
    source: "imagery-source",
  });

  return map;
};
