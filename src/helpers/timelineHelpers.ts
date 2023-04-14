import type { SearchResultMatch, TimelineJSSlide } from "@/types";
import { legacyPrepTimeline } from "@/helpers/legacyPrepTimeline";

export function convertMatchToTimelineJSSlide(
  match: SearchResultMatch
): TimelineJSSlide | null {
  return legacyPrepTimeline(match);
}
