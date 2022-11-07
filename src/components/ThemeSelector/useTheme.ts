import { watch, ref } from "vue";
import { useStorage, usePreferredDark } from "@vueuse/core";

export type ThemeId = "light" | "dark" | "auto" | string;

export interface Theme {
  id: ThemeId;
  name: string;
}

export interface UseThemeOptions {
  themes?: Theme[];
  defaultTheme?: ThemeId;
}

export const useTheme = (opts: UseThemeOptions = {}) => {
  const availableThemes = ref([
    {
      id: "auto",
      name: "Auto",
    },
    {
      id: "light",
      name: "Light",
    },
    {
      id: "dark",
      name: "Dark",
    },
    ...(opts.themes ?? []),
  ]);

  const activeThemeId = useStorage<ThemeId>(
    "theme",
    opts.defaultTheme || "auto"
  );

  function isValidThemeId(id: ThemeId) {
    return availableThemes.value.some((theme) => theme.id === id);
  }

  const prefersDark = usePreferredDark();

  function onChange() {
    const themeId = activeThemeId.value;
    if (!isValidThemeId(themeId)) {
      throw new Error(`Invalid theme id: ${themeId}`);
    }

    if (themeId === "auto") {
      // set to dark or light based on preferred color scheme
      document.documentElement.setAttribute(
        "data-theme",
        prefersDark.value ? "dark" : "light"
      );
      return;
    }

    document.documentElement.setAttribute("data-theme", themeId);
  }

  watch([activeThemeId, prefersDark], onChange, { immediate: true });

  return {
    availableThemes,
    activeThemeId,
  };
};
