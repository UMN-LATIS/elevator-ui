export function parseFormData(formData: FormData): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  for (const [key, value] of Array.from(formData.entries())) {
    // Handle JSON strings in form data
    if (typeof value === "string") {
      try {
        // Try to parse as JSON first
        data[key] = JSON.parse(value);
      } catch {
        // If not JSON, use as string
        data[key] = value;
      }
    } else {
      data[key] = value;
    }
  }

  return data;
}