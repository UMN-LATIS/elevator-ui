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

export const uniqueValues = (inputArray: string[]) => {
  return inputArray.filter((value, index, self) => {
    return self.indexOf(value) === index;
  });
};
