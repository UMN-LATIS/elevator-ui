import { watch, computed } from "vue";
import { useStorage } from "@vueuse/core";
import { useInstanceQuery } from "@/queries/useInstanceQuery";
import { ALL_THEMES } from "@/config";

import "@/css/themes/default.css";
import "@/css/themes/dark.css";
import "@/css/themes/folwell.css";
import "@/css/themes/st-thomas.css";
import "@/css/themes/hotdog.css";
import "@/css/themes/vaporwave.css";
import "@/css/themes/matrix.css";
import "@/css/themes/barbie.css";
import "@/css/themes/nord-dark.css";
import "@/css/themes/nord-light.css";
import "@/css/themes/gameboy.css";
import "@/css/themes/tron.css";
import "@/css/themes/construction.css";
import "@/css/themes/hotrod.css";
import "@/css/themes/simple.css";
import "@/css/themes/neobrutalist.css";
import "@/css/themes/natural.css";
import "@/css/themes/bucky.css";

export function useTheming() {
  const { data: instanceData } = useInstanceQuery();
  const availableThemes = computed(() => {
    const allThemes: readonly string[] = ALL_THEMES;
    const validThemes = (instanceData.value?.theming?.availableThemes ?? [])
      .filter((theme) => allThemes.includes(theme))
      .toSorted();

    return validThemes.length > 0 ? validThemes : ["dark", "light"];
  });
  const defaultTheme = computed(
    () => instanceData.value?.theming?.defaultTheme || "light"
  );
  const isEnabled = computed(
    () => instanceData.value?.theming?.enabled ?? true
  );

  const activeTheme = useStorage<string | null>(
    `theme-${window.location.hostname}`,
    null
  );

  watch(
    [activeTheme, instanceData],
    async () => {
      if (!instanceData.value) return;

      activeTheme.value = activeTheme.value || defaultTheme.value;

      // set theme on the body
      document.documentElement?.setAttribute("data-theme", activeTheme.value);
    },
    { immediate: true }
  );

  return {
    activeTheme,
    availableThemes,
    isEnabled,
    setTheme(theme: string) {
      activeTheme.value = theme;
    },
  };
}
