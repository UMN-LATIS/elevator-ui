import {
  Map as MapboxMap,
  FullscreenControl,
  GeolocateControl,
  ScaleControl,
} from "maplibre-gl";

export const withMapControls = () => (map: MapboxMap) => {
  return map
    .addControl(
      new FullscreenControl({
        container: document.querySelector("body") as HTMLBodyElement,
      })
    )
    .addControl(
      new GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        // When active the map will receive updates to the device's location as it changes.
        trackUserLocation: true,
        // Draw an arrow next to the location dot to indicate which direction the device is heading.
        // showUserHeading: true,
      })
    )
    .addControl(new ScaleControl({ unit: "imperial" }));
};