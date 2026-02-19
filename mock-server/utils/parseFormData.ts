function coerceFormValue(value: unknown): unknown {
  if (typeof value === "string") {
    // Convert "true"/"false" to booleans
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;

    // Convert numeric strings to numbers
    const maybeNumber = Number(value);
    if (!isNaN(maybeNumber)) return maybeNumber;

    return value;
  }
  return value;
}

export function parseFormData(formData: FormData): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  for (const [key, value] of Array.from(formData.entries())) {
    const coercedValue = coerceFormValue(value);

    // parse arrays from form data (e.g. availableThemes[])
    if (key.endsWith("[]")) {
      const arrayKey = key.slice(0, -2);
      if (!data[arrayKey]) {
        data[arrayKey] = [];
      }
      (data[arrayKey] as unknown[]).push(coercedValue);
      continue;
    }

    try {
      // Try to parse as JSON first
      data[key] = JSON.parse(coercedValue as string);
      continue;
    } catch {
      // If not JSON, use the coerced value
      data[key] = coercedValue;
    }
  }

  return data;
}
