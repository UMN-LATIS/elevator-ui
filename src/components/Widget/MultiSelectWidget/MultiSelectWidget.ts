/**
 * Recursively traverses a nested object and collects keys from alternating levels.
 * Note: Despite the name, this function does not sort - it extracts keys in traversal order.
 * 
 * @param inputObject - The object to traverse recursively
 * @param skip - When true, skips current level keys; toggles for each recursive call
 * @returns Flattened array of keys from alternating levels of the object hierarchy
 */
export const recursiveSort = (inputObject: object, skip: boolean): string[] => {
  let outputArray: string[] = [];
  for (const key in inputObject) {
    if (!skip) {
      outputArray.push(key);
    }
    if (typeof inputObject[key] === "object") {
      outputArray = outputArray.concat(recursiveSort(inputObject[key], !skip));
    }
  }
  return outputArray.flat();
};

/**
 * Removes duplicate values from an array of strings, preserving the first occurrence of each value.
 * 
 * @param inputArray - Array of strings that may contain duplicates
 * @returns New array with only unique values, maintaining original order
 */
export const uniqueValues = (inputArray: string[]) => {
  return inputArray.filter((value, index, self) => {
    return self.indexOf(value) === index;
  });
};
