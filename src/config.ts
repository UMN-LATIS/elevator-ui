import { mergeDeepRight } from "ramda";
import { AppConfig } from "@/types";

const defaultConfig: AppConfig = {
  instance: {
    name: import.meta.env.VITE_INSTANCE_NAME ?? "Elevator",
    base: {
      origin: import.meta.env.VITE_BASE_ORIGIN ?? "https://localhost",
      path: import.meta.env.VITE_BASE_PATH ?? "/",
      url: import.meta.env.VITE_BASE_URL ?? "https://localhost/",
    },
  },
  arcgis: {
    apiKey:
      import.meta.env.VITE_ARCGIS_API_KEY ?? "PLEASE_SET_MAPBOX_ACCESS_TOKEN",
  },
  routes: {
    test: import.meta.env.VITE_TEST_ROUTE ?? null,
  },
  mode: import.meta.env.MODE ?? null,
};

const config: AppConfig = mergeDeepRight(
  defaultConfig,
  window?.Elevator?.config ?? {}
);

export default config;
