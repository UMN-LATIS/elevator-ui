import { watch, computed } from "vue";
import { useStorage } from "@vueuse/core";
import { useInstanceQuery } from "@/queries/useInstanceQuery";

function getBaseUrl() {
  return window.location.pathname.split("/")[1]; // get the first part of the url to use as the key for local storage
}

export function useTheming() {
  // const instanceStore = useInstanceStore();
  const { data: instanceData } = useInstanceQuery();
  const availableThemes = computed(
    () => instanceData.value?.theming?.availableThemes || ["light", "dark"]
  );
  const defaultTheme = computed(
    () => instanceData.value?.theming?.defaultTheme || "light"
  );
  const isEnabled = computed(
    () => instanceData.value?.theming?.enabled ?? true
  );

  const baseUrl = getBaseUrl();

  const activeTheme = useStorage(`theme-${baseUrl}`, defaultTheme.value);

  watch(
    [activeTheme, availableThemes],
    async () => {
      // if available theme is set to a theme that isn't available, set it to the default theme
      if (!availableThemes.value.includes(activeTheme.value)) {
        activeTheme.value = defaultTheme.value;
      }

      // set theme on the body
      document.documentElement.setAttribute("data-theme", activeTheme.value);
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
