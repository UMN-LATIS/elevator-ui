import { PHPDateTime } from "@/types";

/** A PHP date as `YYYY-MM-DD`, or "" when there is no date. */
export function phpDateToString(phpDateTime: PHPDateTime | null): string {
  if (!phpDateTime?.date) {
    return "";
  }
  // read the stored day rather than parsing: `new Date` takes the PHP format
  // as local time, which lands on the previous day east of UTC
  return phpDateTime.date.slice(0, 10);
}
