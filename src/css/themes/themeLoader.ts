// Registry of non-default themes. The default theme's CSS ships in the main
// bundle via src/css/app.css; every other theme is dynamically imported the
// first time a user selects it, then cached for subsequent reactivations.

const themeLoaders: Record<string, () => Promise<unknown>> = {
  dark: () => import("./dark.css"),
  folwell: () => import("./folwell.css"),
  "st-thomas": () => import("./st-thomas.css"),
  hotdog: () => import("./hotdog.css"),
  vaporwave: () => import("./vaporwave.css"),
  matrix: () => import("./matrix.css"),
  barbie: () => import("./barbie.css"),
  "nord-dark": () => import("./nord-dark.css"),
  "nord-light": () => import("./nord-light.css"),
  gameboy: () => import("./gameboy.css"),
  tron: () => import("./tron.css"),
  construction: () => import("./construction.css"),
  hotrod: () => import("./hotrod.css"),
  simple: () => import("./simple.css"),
  neobrutalist: () => import("./neobrutalist.css"),
  natural: () => import("./natural.css"),
  bucky: () => import("./bucky.css"),
};

const loadedThemes = new Map<string, Promise<unknown>>();

export async function loadTheme(themeName: string): Promise<void> {
  // default ships in main — nothing to do.
  if (themeName === "default") return;

  const loader = themeLoaders[themeName];
  // Unknown/invalid theme names resolve without throwing so callers can stay
  // simple; the existing availableThemes filter is responsible for validity.
  if (!loader) return;

  let cached = loadedThemes.get(themeName);
  if (!cached) {
    cached = loader();
    loadedThemes.set(themeName, cached);
  }
  await cached;
}

// Exposed for tests — lets each test start with a clean cache.
export function __resetThemeLoaderCacheForTests(): void {
  loadedThemes.clear();
}
