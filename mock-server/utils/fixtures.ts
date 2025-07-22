import { readFileSync } from "fs";
import { join } from "path";

const fixturesPath = join(process.cwd(), "fixtures");

export function loadFixture(filename: string) {
  try {
    const content = readFileSync(join(fixturesPath, filename), "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load fixture ${filename}:`, error);
    return {};
  }
}

export function parseFormData(formData: FormData): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
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

export function delay(ms = 100) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
