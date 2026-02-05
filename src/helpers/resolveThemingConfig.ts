import { uniq } from "ramda";

export interface ThemingConfig {
  availableThemes: string[];
  enabled: boolean;
  defaultTheme: string;
}

/**
 * Resolves theming config with proper fallbacks for empty/invalid values.
 * Ensures availableThemes always has at least one valid theme,
 * and defaultTheme is never empty.
 */
export function resolveThemingConfig(input: {
  availableThemes: string[] | undefined;
  enabled: boolean;
  defaultTheme: string | undefined;
}): ThemingConfig {
  const validThemes = uniq(
    (input.availableThemes ?? []).filter(Boolean)
  ) as string[];

  return {
    availableThemes: validThemes.length > 0 ? validThemes : ["light"],
    enabled: input.enabled,
    defaultTheme: input.defaultTheme || "light",
  };
}
