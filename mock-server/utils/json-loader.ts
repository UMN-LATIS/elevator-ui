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