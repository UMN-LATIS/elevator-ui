import { watch, computed, ref } from "vue";
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

const themeUrlLookup: Record<string, string> = Object.fromEntries(
  Object.entries(themeUrlModules)
    .map(([path, url]) => [path.match(/\/([^/]+)\.css$/)?.[1] ?? "", url])
    .filter(([name]) => name && name !== "_default")
);

const THEME_LINK_ATTR = "data-theme-css";

// Track which themes we've already fetched. Each theme's CSS stays in the DOM
// once loaded — it's scoped to `[data-theme="X"]`, so inactive themes don't
// affect rendering, and re-activating a previously-loaded theme is instant
// (no network, fonts already in the FontFaceSet).
const loadedThemes = new Set<string>();
const inFlightThemes = new Set<string>();

// Tracks the theme the user currently wants. A load handler for a
// superseded theme must NOT apply its attribute — otherwise rapid
// theme-switching can briefly flash to a stale in-flight theme.
let pendingTheme: string | null = null;

// An admin's temporary theme override. Module-scoped so a preview outlives
// any single page: remounts re-run each consumer's immediate watch below,
// which re-applies the preview instead of resetting to the stored theme.
// Never persisted, so a full reload always reverts.
const previewTheme = ref<string | null>(null);

// The instance whose settings page started the preview, so the preview
// pill can link back to it.
const previewInstanceId = ref<number | null>(null);

/**
 * Activate a theme. On first activation, fetches the theme's CSS and waits
 * for it to load before flipping the `data-theme` attribute — otherwise the
 * attribute would point at a theme whose rules haven't arrived, briefly
 * rendering the default baseline. For already-loaded themes, the attribute
 * flip is immediate.
 */
function applyTheme(theme: string) {
  pendingTheme = theme;

  const href = themeUrlLookup[theme];
  if (!href || loadedThemes.has(theme)) {
    document.documentElement?.setAttribute("data-theme", theme);
    return;
  }

  // Fetch already in flight from a previous call — its existing onReady will
  // check `pendingTheme` when it fires.
  if (inFlightThemes.has(theme)) return;
  inFlightThemes.add(theme);

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.setAttribute(THEME_LINK_ATTR, theme);

  const onReady = () => {
    inFlightThemes.delete(theme);
    loadedThemes.add(theme);
    if (pendingTheme !== theme) return;
    document.documentElement?.setAttribute("data-theme", theme);
  };
  link.addEventListener("load", onReady, { once: true });
  link.addEventListener("error", onReady, { once: true });
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

  // The theme the UI actually shows: the preview when one is active,
  // otherwise the saved choice.
  const effectiveTheme = computed(
    () => previewTheme.value ?? activeTheme.value
  );

  watch(
    [activeTheme, previewTheme, instanceData],
    () => {
      if (!instanceData.value) return;
      activeTheme.value = activeTheme.value || defaultTheme.value;
      applyTheme(effectiveTheme.value ?? defaultTheme.value);
    },
    { immediate: true }
  );

  return {
    activeTheme,
    effectiveTheme,
    previewTheme,
    previewInstanceId,
    availableThemes,
    isEnabled,
    setTheme(theme: string): void {
      // choosing a theme outright ends any preview
      previewTheme.value = null;
      previewInstanceId.value = null;
      activeTheme.value = theme;
    },
    /**
     * Preview a theme without touching the saved choice. The instanceId
     * ties the preview back to the settings page that started it.
     */
    startPreview(theme: string, instanceId: number): void {
      previewTheme.value = theme;
      previewInstanceId.value = instanceId;
    },
    endPreview(): void {
      previewTheme.value = null;
      previewInstanceId.value = null;
    },
  };
}
