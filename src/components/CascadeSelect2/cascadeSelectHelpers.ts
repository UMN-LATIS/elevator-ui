import type { Option } from "./CascadeSelect.vue";

/**
 * Get options for a specific level
 */
export function getOptionsForLevel(
  allOptions: Option[],
  selected: (string | number)[],
  level: number
): Option[] {
  if (level === 0) return allOptions;

  // Navigate down the tree based on selections
  let currentOptions = allOptions;
  for (let i = 0; i < level; i++) {
    if (!selected[i]) return [];

    const selectedOption = currentOptions.find(
      (opt) => opt.value === selected[i]
    );
    if (!selectedOption?.children?.length) return [];

    currentOptions = selectedOption.children;
  }

  return currentOptions;
}

/**
 * Determine if a level has any options
 */
export function hasOptionsAtLevel(
  allOptions: Option[],
  selected: (string | number)[],
  level: number
): boolean {
  return getOptionsForLevel(allOptions, selected, level).length > 0;
}

/**
 * Determine the type of options at a level
 */
export function getTypeForLevel(
  allOptions: Option[],
  selected: (string | number)[],
  level: number
): string {
  const options = getOptionsForLevel(allOptions, selected, level);
  return options[0]?.type || `level-${level}`;
}

/**
 * Get label for a level
 */
export function getLabelForLevel(
  allOptions: Option[],
  selected: (string | number)[],
  level: number,
  typeLabels: Record<string, string>
): string {
  const type = getTypeForLevel(allOptions, selected, level);
  return typeLabels[type] || `Select (Level ${level + 1})`;
}

/**
 * Get placeholder for a level
 */
export function getPlaceholderForLevel(
  allOptions: Option[],
  selected: (string | number)[],
  level: number,
  typePlaceholders: Record<string, string>
): string {
  const type = getTypeForLevel(allOptions, selected, level);
  return typePlaceholders[type] || "Select an option";
}

/**
 * Check if a level should be disabled
 */
export function shouldDisableLevel(
  selected: (string | number)[],
  level: number
): boolean {
  return level > 0 && !selected[level - 1];
}

/**
 * Calculate how many levels should be visible
 */
export function calculateVisibleLevels(
  allOptions: Option[],
  selected: (string | number)[]
): number {
  // Always show at least one level
  if (selected.length === 0) return 1;

  // Show one more level than currently selected (if possible)
  const currentLevel = selected.length;
  const hasNextLevel = hasOptionsAtLevel(allOptions, selected, currentLevel);

  return hasNextLevel ? currentLevel + 1 : currentLevel;
}

/**
 * Get the full path of selected items as an array of Option objects
 * @returns Array of selected option objects representing the selection path
 */
export function getSelectionPath(
  options: Option[],
  selected: (string | number)[]
): Option[] {
  const path: Option[] = [];
  let currentOptions = options;

  for (const value of selected) {
    const selectedOption = currentOptions.find((opt) => opt.value === value);
    if (!selectedOption) break;

    path.push(selectedOption);

    if (!selectedOption.children) break;
    currentOptions = selectedOption.children;
  }

  return path;
}
