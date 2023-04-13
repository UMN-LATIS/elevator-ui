import { watch, ref, computed } from "vue";
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
      id: "light",
      name: "Default",
    },
    ...(opts.themes ?? []),
  ]);

  const activeThemeId = useStorage<ThemeId>(
    "theme",
    opts.defaultTheme || "light"
  );

  function isValidThemeId(id: ThemeId) {
    return availableThemes.value.some((theme) => theme.id === id);
  }

  const prefersDark = usePreferredDark();

  // the theme that will be applied
  // if the active theme is "auto", it will be based on the prefersDark value
  const effectiveThemeId = computed(() => {
    if (activeThemeId.value == "auto") {
      return prefersDark.value ? "dark" : "light";
    }
    return activeThemeId.value;
  });

  function onChange() {
    const themeId = activeThemeId.value;
    if (!isValidThemeId(themeId)) {
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
