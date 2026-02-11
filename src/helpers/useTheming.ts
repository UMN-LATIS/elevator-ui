import { watch } from "vue";
import { useStorage } from "@vueuse/core";
import config from "@/config";

export function useTheming() {
  const { availableThemes, defaultTheme } = config.instance.theming;
  const { url: baseUrl } = config.instance.base;
  const isEnabled = config.instance.theming.enabled;

  const activeTheme = useStorage(`theme-${baseUrl}`, defaultTheme);

  watch(
    activeTheme,
    async () => {
      // if available theme is set to a theme that isn't available, set it to the default theme
      if (!availableThemes.includes(activeTheme.value)) {
        activeTheme.value = defaultTheme;
      }

      // set theme on the body
      document.documentElement.setAttribute("data-theme", activeTheme.value);

      // if the theme is light, we're done
      if (activeTheme.value === "light") return;
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
