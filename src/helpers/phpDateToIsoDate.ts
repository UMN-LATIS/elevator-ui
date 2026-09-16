import { PHPDateTime } from "@/types";

/** "" when there is no date. */
export function phpDateToIsoDate(phpDateTime: PHPDateTime | null): string {
  if (!phpDateTime?.date) {
    return "";
  }
  // Read the stored digits rather than parsing. new Date treats the PHP
  // format as local time, so a viewer east of UTC gets the previous day.
  return phpDateTime.date.slice(0, 10);
}
