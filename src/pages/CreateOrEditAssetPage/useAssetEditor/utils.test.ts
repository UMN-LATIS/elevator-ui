import { describe, it, expect } from "vitest";
import { hasAssetChanged, makeLocalAsset, toComparableAsset } from "./utils";
import type { Asset, Template } from "@/types";

const emptyTemplate = {
  templateId: 1,
  widgetArray: [],
} as unknown as Template;

const uploadTemplate = {
  templateId: 1,
  widgetArray: [{ fieldTitle: "upload_1", type: "upload" }],
} as unknown as Template;

const textTemplate = {
  templateId: 1,
  widgetArray: [{ fieldTitle: "text_1", type: "text" }],
} as unknown as Template;

function makeAsset(overrides: Record<string, unknown> = {}): Asset {
  return {
    assetId: "56a3bb007d58ae8a488b4657",
    objectId: "56a3bb007d58ae8a488b4657",
    templateId: 1,
    collectionId: 1,
    ...overrides,
  } as unknown as Asset;
}

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

describe("toComparableAsset", () => {
  it("drops the asset-level fields the server owns", () => {
    const comparable = toComparableAsset(
      makeAsset({
        objectId: "56a3bb007d58ae8a488b4657",
        newTemplateId: "1",
        newCollectionId: "1",
        createdBy: 3,
      }),
      emptyTemplate
    );

    expect(comparable).not.toHaveProperty("objectId");
    expect(comparable).not.toHaveProperty("newTemplateId");
    expect(comparable).not.toHaveProperty("newCollectionId");
    expect(comparable).not.toHaveProperty("createdBy");
  });

  it("drops the id the server assigns to each widget content item", () => {
    const comparable = toComparableAsset(
      makeAsset({ upload_1: [{ id: "1", fileId: "abc" }] }),
      uploadTemplate
    );

    expect(comparable.upload_1).toEqual([{ fileId: "abc" }]);
  });

  it("drops widget content keys holding undefined, which the server never sends", () => {
    const comparable = toComparableAsset(
      makeAsset({
        upload_1: [{ id: "1", fileId: "abc", regenerate: undefined }],
      }),
      uploadTemplate
    );

    expect(comparable.upload_1).toEqual([{ fileId: "abc" }]);
  });

  it("keeps widget content keys holding null, which the server does send", () => {
    const comparable = toComparableAsset(
      makeAsset({ upload_1: [{ id: "1", fileDescription: null }] }),
      uploadTemplate
    );

    expect(comparable.upload_1).toEqual([{ fileDescription: null }]);
  });

  it("keeps the fields an admin edits", () => {
    const comparable = toComparableAsset(
      makeAsset({ collectionId: 7, readyForDisplay: true }),
      emptyTemplate
    );

    expect(comparable.collectionId).toBe(7);
    expect(comparable.readyForDisplay).toBe(true);
  });
});

describe("hasAssetChanged", () => {
  it("reports no change when the two assets match", () => {
    expect(
      hasAssetChanged({
        savedAsset: makeAsset(),
        localAsset: makeAsset(),
        template: emptyTemplate,
      })
    ).toBe(false);
  });

  it("reports a change when the admin edits a field", () => {
    expect(
      hasAssetChanged({
        savedAsset: makeAsset({ collectionId: 1 }),
        localAsset: makeAsset({ collectionId: 2 }),
        template: emptyTemplate,
      })
    ).toBe(true);
  });

  it("ignores objectId, which the server assigns rather than the admin", () => {
    expect(
      hasAssetChanged({
        savedAsset: makeAsset({ objectId: "56a3bb007d58ae8a488b4657" }),
        localAsset: makeAsset({ objectId: "" }),
        template: emptyTemplate,
      })
    ).toBe(false);
  });

  // After creating an asset the working copy is never rebuilt from the server
  // copy, so it keeps the placeholder createdBy that makeLocalAsset sets.
  it("ignores the server-owned fields a freshly created asset lacks", () => {
    expect(
      hasAssetChanged({
        savedAsset: makeAsset({
          createdBy: 3,
          newTemplateId: "1",
          newCollectionId: "1",
        }),
        localAsset: makeAsset({ createdBy: 0 }),
        template: emptyTemplate,
      })
    ).toBe(false);
  });

  it("ignores an upload item's regenerate flag once it has been deleted", () => {
    const savedUpload = { id: "1", fileId: "abc" };
    const localUpload = { id: "1", fileId: "abc" };

    expect(
      hasAssetChanged({
        savedAsset: makeAsset({ upload_1: [savedUpload] }),
        localAsset: makeAsset({ upload_1: [localUpload] }),
        template: uploadTemplate,
      })
    ).toBe(false);
  });

  // A widget default leaves keys holding undefined on the working copy that
  // the saved copy never has. loc on a location widget is the live example.
  it("ignores a widget key holding undefined that the saved copy lacks", () => {
    expect(
      hasAssetChanged({
        savedAsset: makeAsset({ upload_1: [{ id: "1", fileId: "abc" }] }),
        localAsset: makeAsset({
          upload_1: [{ id: "1", fileId: "abc", regenerate: undefined }],
        }),
        template: uploadTemplate,
      })
    ).toBe(false);
  });

  it("reports a change when a widget key holds a real value the saved copy lacks", () => {
    expect(
      hasAssetChanged({
        savedAsset: makeAsset({ upload_1: [{ id: "1", fileId: "abc" }] }),
        localAsset: makeAsset({
          upload_1: [{ id: "1", fileId: "abc", regenerate: true }],
        }),
        template: uploadTemplate,
      })
    ).toBe(true);
  });

  // A create form the admin has not touched yet would otherwise block them
  // from leaving the page.
  it("reports no change for a new asset nobody has edited", () => {
    expect(
      hasAssetChanged({
        savedAsset: null,
        localAsset: makeLocalAsset({
          template: textTemplate,
          collectionId: 1,
          savedAsset: null,
        }),
        template: textTemplate,
      })
    ).toBe(false);
  });

  it("reports a change when the admin fills in a new asset", () => {
    const newAsset = makeLocalAsset({
      template: textTemplate,
      collectionId: 1,
      savedAsset: null,
    });
    newAsset.title = ["Draft title"];

    expect(
      hasAssetChanged({
        savedAsset: null,
        localAsset: newAsset,
        template: textTemplate,
      })
    ).toBe(true);
  });
});
