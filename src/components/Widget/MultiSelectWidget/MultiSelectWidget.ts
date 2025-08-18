/**
 * Recursively traverses a nested object and collects
 * keys from alternating levels.
 * Note: Despite the name, this function does not sort.
 * It extracts keys in traversal order.
 */
export const collectAlternatingKeys = (inputObject: object, skip: boolean): string[] => {
  let outputArray: string[] = [];
  for (const key in inputObject) {
    if (!skip) {
      outputArray.push(key);
    }
    if (typeof inputObject[key] === "object") {
      outputArray = outputArray.concat(collectAlternatingKeys(inputObject[key], !skip));
    }
  }
  return outputArray.flat();
};

export const uniqueValues = (inputArray: string[]) => {
  return inputArray.filter((value, index, self) => {
    return self.indexOf(value) === index;
  });
};
