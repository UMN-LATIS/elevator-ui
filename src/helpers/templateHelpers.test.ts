import { describe, it, expect } from "vitest";
import { shouldExtractLocation, filterGpsFromExif } from "./templateHelpers";
import type { Template } from "@/types";
import type { Exif } from "@/types/FileMetaDataTypes";

function makeTemplate(
  extractLocation?: boolean
): Template {
  return {
    templateId: 1,
    templateName: "Test Template",
    showCollection: false,
    showCollectionPosition: 1,
    showTemplate: false,
    showTemplatePosition: 1,
    widgetArray: [
      {
        widgetId: 1,
        type: "upload",
        fieldTitle: "upload_1",
        label: "Photo",
        tooltip: "",
        fieldData: {
          extractLocation,
        },
        allowMultiple: false,
        attemptAutocomplete: false,
        display: true,
        displayInPreview: false,
        required: false,
        searchable: false,
        directSearch: false,
        clickToSearch: false,
        clickToSearchType: 0,
        viewOrder: 0,
        templateOrder: 0,
      },
    ],
  };
}

function makeTemplateWithoutUpload(): Template {
  return {
    templateId: 2,
    templateName: "No Upload Template",
    showCollection: false,
    showCollectionPosition: 1,
    showTemplate: false,
    showTemplatePosition: 1,
    widgetArray: [
      {
        widgetId: 1,
        type: "text",
        fieldTitle: "text_1",
        label: "Title",
        tooltip: "",
        fieldData: null,
        allowMultiple: false,
        attemptAutocomplete: false,
        display: true,
        displayInPreview: false,
        required: false,
        searchable: false,
        directSearch: false,
        clickToSearch: false,
        clickToSearchType: 0,
        viewOrder: 0,
        templateOrder: 0,
      },
    ],
  };
}

describe("shouldExtractLocation", () => {
  it("returns false when extractLocation is false", () => {
    expect(shouldExtractLocation(makeTemplate(false))).toBe(false);
  });

  it("returns true when extractLocation is true", () => {
    expect(shouldExtractLocation(makeTemplate(true))).toBe(true);
  });

  it("defaults to true when extractLocation is undefined", () => {
    expect(shouldExtractLocation(makeTemplate(undefined))).toBe(true);
  });

  it("defaults to true when template has no upload widget", () => {
    expect(shouldExtractLocation(makeTemplateWithoutUpload())).toBe(true);
  });

  it("defaults to true when template is null", () => {
    expect(shouldExtractLocation(null)).toBe(true);
  });
});

describe("filterGpsFromExif", () => {
  it("removes GPS fields from Composite", () => {
    const exif: Exif = {
      Composite: {
        GPSLatitude: "44 deg 58' 12.34\"",
        GPSLongitude: "-93 deg 15' 45.67\"",
        GPSAltitude: "300 m",
        GPSPosition: "44.97, -93.26",
        ImageSize: "4032x3024",
        Megapixels: 12.2,
      },
    };
    const filtered = filterGpsFromExif(exif);
    expect(filtered.Composite).not.toHaveProperty("GPSLatitude");
    expect(filtered.Composite).not.toHaveProperty("GPSLongitude");
    expect(filtered.Composite).not.toHaveProperty("GPSAltitude");
    expect(filtered.Composite).not.toHaveProperty("GPSPosition");
    expect(filtered.Composite).toHaveProperty("ImageSize", "4032x3024");
    expect(filtered.Composite).toHaveProperty("Megapixels", 12.2);
  });

  it("removes GPS fields from EXIF section", () => {
    const exif: Exif = {
      EXIF: {
        GPSLatitude: "44 deg 58' 12.34\"",
        GPSLongitude: "-93 deg 15' 45.67\"",
        GPSSpeed: 0,
        GPSSpeedRef: "km/h",
        GPSAltitude: "300 m",
        GPSAltitudeRef: "Above Sea Level",
        GPSDestBearing: 180,
        GPSDestBearingRef: "True North",
        GPSImgDirection: 90,
        GPSImgDirectionRef: "True North",
        GPSLatitudeRef: "North",
        GPSLongitudeRef: "West",
        GPSHPositioningError: "5 m",
        Make: "Apple",
        Model: "iPhone 14 Pro",
      },
    };
    const filtered = filterGpsFromExif(exif);
    expect(filtered.EXIF).not.toHaveProperty("GPSLatitude");
    expect(filtered.EXIF).not.toHaveProperty("GPSLongitude");
    expect(filtered.EXIF).not.toHaveProperty("GPSSpeed");
    expect(filtered.EXIF).not.toHaveProperty("GPSAltitude");
    expect(filtered.EXIF).not.toHaveProperty("GPSImgDirection");
    expect(filtered.EXIF).toHaveProperty("Make", "Apple");
    expect(filtered.EXIF).toHaveProperty("Model", "iPhone 14 Pro");
  });

  it("does not mutate the original exif object", () => {
    const exif: Exif = {
      Composite: {
        GPSLatitude: "44 deg",
        ImageSize: "4032x3024",
      },
    };
    filterGpsFromExif(exif);
    expect(exif.Composite).toHaveProperty("GPSLatitude");
  });

  it("handles exif with no GPS fields gracefully", () => {
    const exif: Exif = {
      File: {
        FileSize: "3.2 MB",
        FileType: "JPEG",
      },
    };
    const filtered = filterGpsFromExif(exif);
    expect(filtered.File).toHaveProperty("FileSize", "3.2 MB");
    expect(filtered.File).toHaveProperty("FileType", "JPEG");
  });

  it("handles undefined exif sections gracefully", () => {
    const exif: Exif = {};
    const filtered = filterGpsFromExif(exif);
    expect(filtered).toEqual({});
  });
});
