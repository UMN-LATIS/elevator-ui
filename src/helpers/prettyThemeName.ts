/** Formats a theme slug for display, e.g. "nord-dark" becomes "Nord Dark". */
export function prettyThemeName(theme: string): string {
  return theme
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
