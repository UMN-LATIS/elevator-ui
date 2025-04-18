import type { MultiSelectFieldData, MultiSelectWidgetContent } from "@/types";
import { isEmpty } from "ramda";

interface OptionWithType {
  type: string;
  value: string;
  children?: OptionWithType[];
}

/**
 * Transforms a nested object structure into Option objects for the CascadingSelect component
 */
export function toCascadeSelectOptions(
  fieldData: MultiSelectFieldData
): OptionWithType[] {
  if (isEmpty(fieldData)) {
    return [];
  }

  const fieldType = Object.keys(fieldData)[0];
  const fieldValues = fieldData[fieldType];

  // If fieldValues is an array, directly map it to options
  if (Array.isArray(fieldValues)) {
    return fieldValues.map((value) => ({
      type: fieldType,
      label: value,
      value,
    }));
  }

  // If it's an object, each key is an option, and we recurse to get children
  return Object.entries(fieldValues).map(([key, nestedData]) => ({
    type: fieldType,
    label: key,
    value: key,
    children: toCascadeSelectOptions(nestedData),
  }));
}

/**
 * Creates a path of select options based on field contents
 */
function buildOptionPath(
  availableOptions: OptionWithType[],
  fieldContents: MultiSelectWidgetContent["fieldContents"],
  accumulatedPath: OptionWithType[] = []
): OptionWithType[] {
  if (isEmpty(availableOptions)) {
    return accumulatedPath;
  }

  for (const option of availableOptions) {
    const selectedValue = fieldContents[option.type] as string | undefined;

    // Skip if this option isn't selected in the field contents
    if (selectedValue === undefined || selectedValue !== option.value) {
      continue;
    }

    // Add this option to the path and recurse into children if any
    const updatedPath = [...accumulatedPath, option];
    return buildOptionPath(option.children ?? [], fieldContents, updatedPath);
  }

  return accumulatedPath;
}

/**
 * Converts field data and contents into a path of values
 */
export function toCascadeSelectPath(
  fieldData: MultiSelectFieldData,
  fieldContents: MultiSelectWidgetContent["fieldContents"]
): string[] {
  const availableOptions = toCascadeSelectOptions(fieldData);
  const optionPath = buildOptionPath(availableOptions, fieldContents);
  return optionPath.map((option) => option.value.toString());
}

/**
 * Transforms a path of values into a field contents object
 */
export function toMultiSelectFieldContents(
  fieldData: MultiSelectFieldData,
  valuePath: (string | number)[],
  availableOptions?: OptionWithType[],
  resultContents: MultiSelectWidgetContent["fieldContents"] = {}
): MultiSelectWidgetContent["fieldContents"] {
  // Base case: if no more path segments to process, return the accumulated field contents
  if (valuePath.length === 0) {
    return resultContents;
  }

  // Initialize options from field data if not provided
  const options = availableOptions ?? toCascadeSelectOptions(fieldData);
  const [currentValue, ...remainingValues] = valuePath;

  // Find the option matching the current path segment
  const matchingOption = options.find(
    (option) => option.value === currentValue
  );

  if (!matchingOption) {
    // If no matching option is found, return the accumulated field contents
    return resultContents;
  }

  // Update field contents with the current segment and continue recursion
  return toMultiSelectFieldContents(
    fieldData,
    remainingValues,
    matchingOption?.children ?? [],
    {
      ...resultContents,
      [matchingOption?.type]: matchingOption?.value,
    }
  );
}
