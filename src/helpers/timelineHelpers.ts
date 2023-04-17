import type { SearchResultMatch, TimelineJSSlide } from "@/types";

export type DateObject = {
  display_date?: string;
  year: number;
  month: number;
  day: number;
};

// converts a UTC date to a DateObject
export function toDateObject(utcDate: Date): DateObject {
  return {
    display_date: utcDate.toLocaleDateString("en-US", { timeZone: "UTC" }),
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

export function toTimelineJSSlide(match: SearchResultMatch): TimelineJSSlide {
  const dateAsset = match.dates[0].dateAsset[0];

  const start_date = convertTimestampToDateObject(dateAsset.start.numeric);
  const end_date = dateAsset.end?.numeric
    ? convertTimestampToDateObject(dateAsset.end.numeric)
    : undefined;

  const headline = `<a href="/defaultinstance/asset/viewAsset/${match.objectId}">${match.title}</a>`;

  const dateEntries = match.entries?.flatMap((entry) => entry.entries) ?? [];

  const text = `<div class="previewEntry"><strong>Date:</strong><ul>${dateEntries
    .map((entry) => `<li>${entry}</li>`)
    .join("")}</ul></div>`;

  const media = match.primaryHandlerThumbnail2x
    ? {
        thumbnail: match.primaryHandlerThumbnail2x,
        url: match.primaryHandlerThumbnail2x,
      }
    : undefined;

  return {
    start_date,
    end_date,
    text: {
      headline,
      text,
    },
    media,
  };
}
