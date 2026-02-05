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

  const availableThemes = validThemes.length > 0 ? validThemes : ["light"];
  const requestedDefault = input.defaultTheme || "light";
  const defaultTheme = availableThemes.includes(requestedDefault)
    ? requestedDefault
    : availableThemes[0];

  return {
    availableThemes,
    enabled: input.enabled,
    defaultTheme,
  };
}
