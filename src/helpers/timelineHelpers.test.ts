import { describe, expect, it } from "@jest/globals";
import {
  toTimelineJSSlide,
  convertTextToDateObject,
  convertTimestampToDateObject,
  convertMatchesToTimelineJSSlides,
  toDateObject,
} from "./timelineHelpers";
import { SearchResultMatch } from "@/types";
import {
  mockSearchResults,
  mockTimelineJSSlides,
} from "../__mocks__/mockObamaSpeechesCollection";

const africaLeadersSpeechMatch: SearchResultMatch = {
  dates: [
    {
      label: "Date",
      dateAsset: [
        {
          end: {
            text: "",
            numeric: "",
          },
          label: "",
          start: {
            text: "08/05/2014",
            numeric: "1407196800",
          },
          isPrimary: true,
        },
      ],
    },
  ],
  title: "Africa Leaders Speech",
  entries: [
    {
      Date: true,
      label: "Date",
      entries: ["08/05/2014"],
    },
  ],
  objectId: "58bb0779ba98a87e062c0740",
  locations: [],
  primaryHandlerId: "58bb07c8ba98a8242c8b4574",
  primaryHandlerType: "AudioHandler",
  primaryHandlerThumbnail:
    "//elevatorbetabucket.s3.amazonaws.com/thumbnail/4754b8c2428a89ab8c70bb85-thumbnail",
  primaryHandlerThumbnail2x:
    "//elevatorbetabucket.s3.amazonaws.com/thumbnail/4754b8c2428a89ab8c70bb85-thumbnail2x",
  collectionHierarchy: [
    {
      id: 35,
      title: "Obama Speeches",
    },
  ],
  template: {
    name: "Speech",
    id: 49,
  },
  base_url: "/defaultinstance/",
  isChild: false,
  hasChildren: false,
};

describe("timelineHelpers", () => {
  describe("toDateObject", () => {
    it("converts a Date to a DateObject", () => {
      expect(toDateObject(new Date("08/05/2014"))).toEqual({
        display_date: "08/05/2014",
        year: 2014,
        month: 8,
        day: 5,
      });
    });
  });

  describe("convertDateStringToObject", () => {
    it("converts a MM-DD-YYYY date string to a DateObject", () => {
      expect(convertTextToDateObject("08-05-2014")).toEqual({
        display_date: "08/05/2014",
        year: 2014,
        month: 8,
        day: 5,
      });
    });

    it("converts a MM/DD/YYYY date string to a DateObject", () => {
      expect(convertTextToDateObject("08/05/2014")).toEqual({
        display_date: "08/05/2014",
        year: 2014,
        month: 8,
        day: 5,
      });
    });
  });

  describe("convertDateTimestampToObject", () => {
    it("converts a timestamp to a DateObject", () => {
      expect(convertTimestampToDateObject(1407196800)).toEqual({
        display_date: "8/5/2014",
        year: 2014,
        month: 8,
        day: 5,
      });
    });
  });

  describe("toTimelineJSSlide", () => {
    it("should convert a search result match to a timelineJS slide", () => {
      expect(
        toTimelineJSSlide({
          ...africaLeadersSpeechMatch,
          dates: [],
        })
      ).toBeNull();
    });
  });

  describe("convertMatchesToTimelineJSSlides", () => {
    it("should convert a list of search result matches to a list of timelineJS slides", () => {
      expect(convertMatchesToTimelineJSSlides(mockSearchResults)).toEqual(
        mockTimelineJSSlides
      );
    });
  });
});
