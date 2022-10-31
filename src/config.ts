import { mergeDeepRight } from "ramda";
import { AppConfig } from "@/types";

const defaultConfig: AppConfig = {
  baseUrl: import.meta.env.VITE_BASE_URL || "http://localhost",
  arcgis: {
    apiKey:
      import.meta.env.VITE_ARCGIS_API_KEY ?? "PLEASE_SET_MAPBOX_ACCESS_TOKEN",
  },
};

// merge default config with anything on window.Elevator.config
export default mergeDeepRight(defaultConfig, window?.Elevator?.config ?? {});
