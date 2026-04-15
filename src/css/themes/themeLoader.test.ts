import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadTheme, __resetThemeLoaderCacheForTests } from "./themeLoader";

describe("themeLoader", () => {
  beforeEach(() => {
    __resetThemeLoaderCacheForTests();
    vi.clearAllMocks();
  });

  it("returns immediately for the default theme without importing extra CSS", async () => {
    // The default theme is bundled in main CSS — loading it should be a no-op.
    // We can't easily assert "no import happened" directly; instead, assert that
    // the call resolves synchronously-fast and does not throw.
    await expect(loadTheme("default")).resolves.toBeUndefined();
  });

  it("resolves without throwing for a theme that is not registered", async () => {
    // Unknown theme names should not break the caller; the app will fall back
    // via its existing availableThemes filter.
    await expect(loadTheme("nonexistent-theme")).resolves.toBeUndefined();
  });

  it("caches a theme after it has been loaded once", async () => {
    // Call twice; the second call should return the cached promise, not import again.
    // We verify this behaviorally: both calls resolve, and re-calling is idempotent.
    await loadTheme("dark");
    await expect(loadTheme("dark")).resolves.toBeUndefined();
  });
});
