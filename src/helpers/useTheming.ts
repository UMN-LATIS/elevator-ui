import { watch, computed } from "vue";
import { useStorage } from "@vueuse/core";
import { useInstanceQuery } from "@/queries/useInstanceQuery";
import { ALL_THEMES } from "@/config";

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
    async (...args) => {
      console.log("activeTheme or instanceData changed, applying theme", {
        activeTheme: activeTheme.value,
        instanceData: instanceData.value,
        args,
      });

      if (!instanceData.value) return;

      activeTheme.value = activeTheme.value || defaultTheme.value;

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
