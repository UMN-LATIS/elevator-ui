import { uniq } from "ramda";
import deepmerge from "deepmerge";
import { AppConfig } from "@/types";

const defaultConfig: AppConfig = {
  instance: {
    base: {
      origin: import.meta.env.VITE_BASE_ORIGIN ?? "https://localhost",
      path: import.meta.env.VITE_BASE_PATH ?? "/",
      url: import.meta.env.VITE_BASE_URL ?? "https://localhost/",
    },
    theming: {
      // list of themes
      availableThemes: import.meta.env.VITE_THEMING_THEMES?.split(",") ?? [
        "light",
      ],
      enabled:
        import.meta.env.VITE_THEMING_ENABLED?.toLowerCase() === "true" ?? true,
      defaultTheme: import.meta.env.VITE_THEMING_DEFAULT ?? "light",
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
  moreLikeThis: {
    maxInlineResults: 3,
  },
};

const overwriteMerge = (destArray, sourceArray) => sourceArray;

const mergedConfig: AppConfig = deepmerge(
  defaultConfig,
  window?.Elevator?.config ?? {},
  { arrayMerge: overwriteMerge }
);

// dedupe the availableThemes array
mergedConfig.instance.theming.availableThemes = uniq(
  mergedConfig.instance.theming.availableThemes
);

export default mergedConfig;
