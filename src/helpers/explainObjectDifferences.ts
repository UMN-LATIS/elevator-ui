/**
 * Find differences between two objects and return a description of where they differ
 * @param obj1 First object to compare
 * @param obj2 Second object to compare
 * @param path Current path (used in recursion)
 * @returns Array of difference descriptions
 */
const findDifferences = (obj1: unknown, obj2: unknown, path = ""): string[] => {
  // If they're strictly equal, no differences
  if (obj1 === obj2) return [];

  // Different types
  if (typeof obj1 !== typeof obj2) {
    return [`${path}: different types - ${typeof obj1} vs ${typeof obj2}`];
  }

  // Handle null values
  if (obj1 === null || obj2 === null) {
    return [
      `${path}: ${obj1 === null ? "null" : String(obj1)} vs ${
        obj2 === null ? "null" : String(obj2)
      }`,
    ];
  }

  // Handle primitive types
  if (typeof obj1 !== "object") {
    return [`${path}: ${String(obj1)} vs ${String(obj2)}`];
  }

  // Handle arrays
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) {
      return [
        `${path}: arrays have different lengths (${obj1.length} vs ${obj2.length})`,
      ];
    }

    const differences: string[] = [];
    for (let i = 0; i < obj1.length; i++) {
      const nestedDiffs = findDifferences(obj1[i], obj2[i], `${path}[${i}]`);
      differences.push(...nestedDiffs);
    }
    return differences;
  }

  // One is array, one is not
  if (Array.isArray(obj1) !== Array.isArray(obj2)) {
    return [`${path}: one is array, other is object`];
  }

  // Handle objects
  const differences: string[] = [];

  // Type assertion since we've checked that these are objects
  const obj1AsRecord = obj1 as Record<string, unknown>;
  const obj2AsRecord = obj2 as Record<string, unknown>;

  // Check for keys in both objects
  const allKeys = new Set([
    ...Object.keys(obj1AsRecord),
    ...Object.keys(obj2AsRecord),
  ]);

  for (const key of allKeys) {
    const keyPath = path ? `${path}.${key}` : key;

    // Key exists in obj1 but not in obj2
    if (!(key in obj1AsRecord)) {
      differences.push(`${keyPath}: key missing in first object`);
      continue;
    }

    // Key exists in obj2 but not in obj1
    if (!(key in obj2AsRecord)) {
      differences.push(`${keyPath}: key missing in second object`);
      continue;
    }

    // Recursively compare nested values
    const nestedDiffs = findDifferences(
      obj1AsRecord[key],
      obj2AsRecord[key],
      keyPath
    );
    differences.push(...nestedDiffs);
  }

  return differences;
};

/**
 * Wrapper function that returns a formatted string of differences
 * @param obj1 First object to compare
 * @param obj2 Second object to compare
 * @returns Formatted string describing differences
 */
export const explainObjectDifferences = (
  obj1: unknown,
  obj2: unknown
): string => {
  const differences = findDifferences(obj1, obj2);

  if (differences.length === 0) {
    return "Objects are equal.";
  }

  return "Objects differ in the following ways:\n" + differences.join("\n");
};
