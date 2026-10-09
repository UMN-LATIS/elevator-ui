export function splitFieldTitle(fieldTitle: string): {
  name: string;
  instanceSuffix: string;
} {
  const suffixStart = fieldTitle.search(/_\d+$/);
  if (suffixStart === -1) {
    return { name: fieldTitle, instanceSuffix: "" };
  }
  return {
    name: fieldTitle.slice(0, suffixStart),
    instanceSuffix: fieldTitle.slice(suffixStart),
  };
}
