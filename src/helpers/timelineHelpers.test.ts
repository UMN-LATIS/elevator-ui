import { describe, expect, it } from "@jest/globals";
import { convertMatchToTimelineJSSlide } from "./timelineHelpers";
import {
  mockSearchResults,
  mockTimelineJSSlides,
} from "@/__mocks__/mockObamaSpeechesCollection";

describe("timelineHelpers", () => {
  it("should convert a search result match to a timelineJS slide", () => {
    const slides = mockSearchResults
      .map(convertMatchToTimelineJSSlide)
      .filter(Boolean);
    expect(slides).toEqual(mockTimelineJSSlides);
  });
});
