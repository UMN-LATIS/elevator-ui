import { describe, it, expect } from "vitest";
import { makeLocalAsset } from "./utils";
import type { Template } from "@/types";

const emptyTemplate = {
  templateId: 1,
  widgetArray: [],
} as unknown as Template;

describe("makeLocalAsset", () => {
  it("returns null modified date for a new unsaved asset", () => {
    const asset = makeLocalAsset({
      template: emptyTemplate,
      collectionId: 42,
      savedAsset: null,
    });

    expect(asset.modified).toBeNull();
  });
});
