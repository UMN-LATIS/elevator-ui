import { mergeDeepWith, concat, uniq } from "ramda";
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
      availableThemes: import.meta.env.VITE_AVAILABLE_THEMES.split(",") ?? [
        "light",
      ],
      enabled: import.meta.env.VITE_THEME_ENABLED ?? true,
      defaultTheme: import.meta.env.VITE_THEME_DEFAULT ?? "light",
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

// to handle merging the theme arrays in window.Elevator.config with the
// we need to use a custom merge function that will concat the arrays and
// dedupe them.

const mergedConfig: AppConfig = mergeDeepWith(
  // concat any arrays within the config (e.g. availableThemes)
  concat,
  defaultConfig,
  window?.Elevator?.config ?? {}
);

// dedupe the availableThemes array
mergedConfig.instance.theming.availableThemes = uniq(
  mergedConfig.instance.theming.availableThemes
);

export default mergedConfig;
