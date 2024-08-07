import type {
  SearchResultMatch,
  TimelineJSSlide,
  SearchResultMatchEntry,
} from "@/types";
import config from "@/config";

export type DateObject = {
  display_date?: string;
  year: number;
  month: number;
  day: number;
};

// converts a UTC date to a DateObject
export function toDateObject(utcDate: Date): DateObject {
  return {
    // 05/31/2025
    display_date: utcDate.toLocaleDateString("en-US", {
      timeZone: "UTC",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1, // Months are zero-based, so we need to add 1
    day: utcDate.getUTCDate(),
  };
}

export function convertTextToDateObject(dateText: string): DateObject | null {
  const date = new Date(dateText);

  if (isNaN(date.getTime())) {
    return null;
  }

  return toDateObject(date);
}

export function convertTimestampToDateObject(
  timestamp: number | string
): DateObject {
  const numericTimestamp =
    typeof timestamp === "string" ? Number.parseInt(timestamp) : timestamp;

  const date = new Date(numericTimestamp * 1000);
  return toDateObject(date);
}

export function renderMatchEntries(entries: SearchResultMatchEntry[]): string {
  const EntryItem = (entryItem: string) => `<li>${entryItem}</li>`;

  const EntryList = (entry: SearchResultMatchEntry) =>
    `<div class="previewEntry"><strong>${entry.label}:</strong><ul>${
      entry.entries?.map(EntryItem).join("") ?? ""
    }</ul></div>`;

  return entries.map(EntryList).join("");
}

export function toTimelineJSSlide(
  match: SearchResultMatch
): TimelineJSSlide | null {
  if (!match.dates?.length) return null;

  const dateAsset = match.dates[0].dateAsset[0];

  const start_date = convertTimestampToDateObject(dateAsset.start.numeric);
  const end_date = dateAsset.end?.numeric
    ? convertTimestampToDateObject(dateAsset.end.numeric)
    : undefined;

  const headline = `<a href="${config.instance.base.path}/asset/viewAsset/${match.objectId}">${match.title}</a>`;

  const text = match.entries ? renderMatchEntries(match.entries) : "";

  const media = match.primaryHandlerThumbnail2x
    ? {
        thumbnail: match.primaryHandlerThumbnail2x,
        url: match.primaryHandlerThumbnail2x,
      }
    : undefined;

  return {
    start_date,
    // only include end_date if it's defined
    ...(end_date && { end_date }),
    text: {
      headline,
      text,
    },
    media,
  };
}

export function convertMatchesToTimelineJSSlides(
  matches: SearchResultMatch[]
): TimelineJSSlide[] {
  return matches
    .map(toTimelineJSSlide)
    .filter((slide) => slide !== null) as TimelineJSSlide[];
}
