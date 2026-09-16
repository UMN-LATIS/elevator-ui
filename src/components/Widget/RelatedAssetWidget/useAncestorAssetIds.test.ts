import { describe, it, expect } from "vitest";
import { canNestAsset } from "./useAncestorAssetIds";

describe("canNestAsset", () => {
  it("nests an asset that is not among its own ancestors", () => {
    const ancestorAssetIds = new Set(["asset-1", "asset-2"]);

    expect(canNestAsset(ancestorAssetIds, "asset-3")).toBe(true);
  });

  it("refuses an asset that is already an ancestor", () => {
    const ancestorAssetIds = new Set(["asset-1", "asset-2"]);

    expect(canNestAsset(ancestorAssetIds, "asset-1")).toBe(false);
  });

  it("nests up to the depth cap", () => {
    const nineAncestors = new Set(
      Array.from({ length: 9 }, (_, i) => `asset-${i}`)
    );

    expect(canNestAsset(nineAncestors, "asset-new")).toBe(true);
  });

  it("refuses past the depth cap even for a never-seen asset", () => {
    const tenAncestors = new Set(
      Array.from({ length: 10 }, (_, i) => `asset-${i}`)
    );

    expect(canNestAsset(tenAncestors, "asset-new")).toBe(false);
  });

  it("nests freely with no ancestors", () => {
    expect(canNestAsset(new Set(), "asset-1")).toBe(true);
  });
});
