const isTraversableObject = (obj: unknown): obj is Record<string, unknown> => {
  return !!obj && typeof obj === "object" && !Array.isArray(obj);
};

export function findDeepestPath(
  obj: unknown,
  parentPath = [] as string[],
  currentDeepest = [] as string[]
): string[] {
  if (!isTraversableObject(obj)) {
    return currentDeepest;
  }

  return Object.keys(obj).reduce((deepest, currentKey) => {
    const currentPath = [...parentPath, currentKey];
    const currentValue = obj[currentKey];

    if (isTraversableObject(currentValue)) {
      return findDeepestPath(currentValue, currentPath, deepest);
    }

    return currentPath.length > deepest.length ? currentPath : deepest;
  }, currentDeepest as string[]);
}
