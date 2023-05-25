import { watch, computed } from "vue";
import { useStorage, usePreferredDark } from "@vueuse/core";
import config from "@/config";

export type Theme = "light" | "dark" | "auto" | string;

export interface UseThemeOptions {
  themes?: Theme[];
  defaultTheme?: Theme;
}

export const useTheme = (opts: UseThemeOptions = {}) => {
  const availableThemes = config.instance.theming.availableThemes;

  const activeThemeId = useStorage<Theme>(
    "theme",
    opts.defaultTheme || "light"
  );

  // if the active theme is "auto", it will be based on the prefersDark value
  const prefersDark = usePreferredDark();

  const effectiveThemeId = computed(() => {
    if (activeThemeId.value !== "auto") {
      return activeThemeId.value;
    }

    // if the active theme is "auto" but there are no other themes available,
    if (
      !availableThemes.includes("light") ||
      !availableThemes.includes("dark")
    ) {
      return activeThemeId.value;
    }

    return prefersDark.value ? "dark" : "light";
  });

  function onChange() {
    const themeId = activeThemeId.value;
    if (!availableThemes.includes(themeId)) {
      throw new Error(`Invalid theme id: ${themeId}`);
    }

    document.documentElement.setAttribute("data-theme", effectiveThemeId.value);
  }

  watch([activeThemeId, prefersDark], onChange, { immediate: true });

  return {
    availableThemes,
    activeThemeId,
    effectiveThemeId,
  };
};
