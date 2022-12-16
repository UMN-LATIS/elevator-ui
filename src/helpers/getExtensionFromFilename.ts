export const getExtensionFromFilename = (filename: string) => {
  const parts = filename.split(".");
  return parts[parts.length - 1]; // last extension
};
