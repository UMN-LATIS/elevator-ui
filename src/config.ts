import deepmerge from "deepmerge";
import { AppConfig } from "@/types";

export const ALL_THEMES = [
  "light",
  "dark",
  "folwell",
  "st-thomas",
  "hotdog",
] as const;

const defaultConfig: AppConfig = {
  instance: {
    base: {
      origin: import.meta.env.VITE_BASE_ORIGIN ?? "http://localhost",
      path: import.meta.env.VITE_BASE_PATH ?? "/",
      url: import.meta.env.VITE_BASE_URL ?? "http://localhost/",
    },
    theming: {
      availableThemes: ["light"],
      enabled: import.meta.env.VITE_THEME_ENABLED?.toLowerCase() === "true",
      defaultTheme: import.meta.env.VITE_DEFAULT_THEME || "light",
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
    autoloadMaxSearchResults:
      import.meta.env.VITE_AUTO_LOAD_ALL_RESULTS?.toLowerCase() === "true",
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
  isUsingMockServer: import.meta.env.VITE_IS_USING_MOCK_SERVER
    ? import.meta.env.VITE_IS_USING_MOCK_SERVER.toLowerCase() === "true"
    : false,
};

const globalConfig = globalThis?.Elevator?.config ?? {};

const mergedConfig: AppConfig = deepmerge(defaultConfig, globalConfig);

// Instance theming config takes priority over defaults — don't merge arrays
if (globalConfig.instance?.theming) {
  mergedConfig.instance.theming = {
    ...defaultConfig.instance.theming,
    ...globalConfig.instance.theming,
  };
}

export default mergedConfig;
