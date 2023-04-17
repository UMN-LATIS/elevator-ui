import { describe, expect, it } from "@jest/globals";
import {
  toTimelineJSSlide,
  convertTextToDateObject,
  convertTimestampToDateObject,
  toDateObject,
} from "./timelineHelpers";
import { SearchResultMatch, TimelineJSSlide } from "@/types";

describe("timelineHelpers", () => {
  describe("toDateObject", () => {
    it("converts a Date to a DateObject", () => {
      const date = new Date("08/05/2014");
      const dateObject = toDateObject(date);

      expect(dateObject).toEqual({
        display_date: "8/5/2014",
        year: 2014,
        month: 8,
        day: 5,
      });
    });
  });

  describe("convertDateStringToObject", () => {
    it("converts a MM-DD-YYYY date string to a DateObject", () => {
      const dateText = "08-05-2014";
      const dateObject = convertTextToDateObject(dateText);

      expect(dateObject).toEqual({
        display_date: "8/5/2014",
        year: 2014,
        month: 8,
        day: 5,
      });
    });

    it("converts a MM/DD/YYYY date string to a DateObject", () => {
      const dateText = "08/05/2014";
      const dateObject = convertTextToDateObject(dateText);

      expect(dateObject).toEqual({
        display_date: "8/5/2014",
        year: 2014,
        month: 8,
        day: 5,
      });
    });
  });

  describe("convertDateTimestampToObject", () => {
    it("converts a timestamp to a DateObject", () => {
      const timestamp = 1407196800;
      const dateObject = convertTimestampToDateObject(timestamp);

      expect(dateObject).toEqual({
        display_date: "8/5/2014",
        year: 2014,
        month: 8,
        day: 5,
      });
    });
  });

  describe("toTimelineJSSlide", () => {
    it("should convert a search result match to a timelineJS slide", () => {
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

      const africaLeadersSpeechSlide: TimelineJSSlide = {
        start_date: {
          display_date: "8/5/2014",
          year: 2014,
          month: 8,
          day: 5,
        },
        text: {
          headline:
            '<a href="/defaultinstance/asset/viewAsset/58bb0779ba98a87e062c0740">Africa Leaders Speech</a>',
          text: `<div class=\"previewEntry\"><strong>Date:</strong><ul><li>08/05/2014</li></ul></div>`,
        },
        media: {
          thumbnail:
            "//elevatorbetabucket.s3.amazonaws.com/thumbnail/4754b8c2428a89ab8c70bb85-thumbnail2x",
          url: "//elevatorbetabucket.s3.amazonaws.com/thumbnail/4754b8c2428a89ab8c70bb85-thumbnail2x",
        },
      };
      expect(toTimelineJSSlide(africaLeadersSpeechMatch)).toEqual(
        africaLeadersSpeechSlide
      );
    });
  });
});
