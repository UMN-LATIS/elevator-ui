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
      availableThemes: import.meta.env.VITE_AVAILABLE_THEMES?.split(",") ?? [
        "light",
      ],
      enabled: import.meta.env.VITE_THEME_ENABLED?.toLowerCase() === "true",
      defaultTheme: import.meta.env.VITE_DEFAULT_THEME ?? "light",
    },
    moreLikeThis: {
      maxInlineResults: 3,
    },
    textAreaItem: {
      // height in pixels
      // ex. for 3 lines: 16px * 1.5 line-height * 3 lines = 72px
      defaultTextTruncationHeight: 72,
    },
    googleAnalyticsId: import.meta.env.VITE_GOOGLE_ANALYTICS_ID ?? null,
  },
  arcgis: {
    apiKey:
      import.meta.env.VITE_ARCGIS_API_KEY ?? "PLEASE_SET_MAPBOX_ACCESS_TOKEN",
  },
  routes: {
    home: {
      redirect: import.meta.env.VITE_ROUTES_HOME_REDIRECT ?? null,
    },
  },
  mode: import.meta.env.MODE ?? null,
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
