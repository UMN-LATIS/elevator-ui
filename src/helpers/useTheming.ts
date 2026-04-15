import { watch, computed } from "vue";
import { useStorage } from "@vueuse/core";
import { useInstanceQuery } from "@/queries/useInstanceQuery";
import { ALL_THEMES } from "@/config";

// `_default.css` is eager — its `:root` tokens are the baseline every themed
// component reads, so they must be present at first paint.
import "@/css/themes/_default.css";

// Every other theme is emitted as a standalone, fingerprinted CSS asset by
// Vite (`?url` tells Vite to process the file and return its public URL
// without bundling its CSS into main). We inject a <link> tag on activation,
// so a theme's CSS — and any `@import` it makes for fonts — only loads when
// the user selects that theme.
const themeUrlModules = import.meta.glob("@/css/themes/*.css", {
  query: "?url",
  import: "default",
  eager: true,
}) as Record<string, string>;

const themeHref: Record<string, string> = Object.fromEntries(
  Object.entries(themeUrlModules)
    .map(([path, url]) => [path.match(/\/([^/]+)\.css$/)?.[1] ?? "", url])
    .filter(([name]) => name && name !== "_default")
);

const THEME_LINK_ATTR = "data-theme-css";

/**
 * Activate a theme: set the `data-theme` and swap the `<link>` tag carrying
 * that theme's CSS.
 */
function applyTheme(theme: string) {
  document.documentElement?.setAttribute("data-theme", theme);

  const existing = document.querySelector<HTMLLinkElement>(
    `link[${THEME_LINK_ATTR}]`
  );
  const href = themeHref[theme];

  if (!href) {
    existing?.remove();
    return;
  }
  if (existing?.getAttribute(THEME_LINK_ATTR) === theme) return;

  // Append the new link first so the new theme's rules are parsed before the
  // old ones are removed, minimizing the unstyled-flash window.
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.setAttribute(THEME_LINK_ATTR, theme);
  link.addEventListener("load", () => existing?.remove(), { once: true });
  link.addEventListener("error", () => existing?.remove(), { once: true });
  document.head.appendChild(link);
}

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
    () => {
      if (!instanceData.value) return;
      activeTheme.value = activeTheme.value || defaultTheme.value;
      applyTheme(activeTheme.value);
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
