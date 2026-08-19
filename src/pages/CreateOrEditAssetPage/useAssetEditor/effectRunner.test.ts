/**
 * The effect runner against a fake query client and a recorded dispatch
 * log. What matters here is ordering: a create commits its id before the
 * read-back, the read-back runs inside the save queue, and children save
 * before their parent snapshots.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/vue-query";
import * as T from "@/types";
import * as fetchers from "@/api/fetchers";
import { EditorEvent, EditorState, initialEditorState } from "./types";
import { update } from "./update";
import { createEffectRunner, EditorPageHandlers } from "./effectRunner";

vi.mock("@/api/fetchers", () => ({
  fetchAsset: vi.fn(),
  fetchTemplate: vi.fn(),
  createAsset: vi.fn(),
  updateAsset: vi.fn(),
}));

const mocked = vi.mocked(fetchers);

const template: T.Template = {
  templateId: 1,
  widgetArray: [
    { widgetId: 1, type: "text", fieldTitle: "field_1", label: "Field 1" },
  ],
} as unknown as T.Template;

const makeAsset = (assetId: string): T.Asset =>
  ({
    assetId,
    templateId: 1,
    readyForDisplay: true,
    collectionId: 1,
    availableAfter: null,
    modified: { date: "2026-01-01 00:00:00" },
    modifiedBy: 1,
    createdBy: 1,
    deletedBy: null,
    relatedAssetCache: null,
    field_1: [{ uuid: "row-1", fieldContents: "stored" }],
  } as unknown as T.Asset);

/**
 * A tiny synchronous dispatch loop: it folds through the real reducer so
 * the effect runner sees the same state a page would, and the log records
 * what was dispatched in what order.
 */
function makeHarness(handlers: Partial<EditorPageHandlers> = {}) {
  let state: EditorState = initialEditorState;
  const log: EditorEvent[] = [];
  let uuidCount = 0;
  const deps = { createUuid: () => `created-${++uuidCount}` };
  const dispatch = (event: EditorEvent) => {
    log.push(event);
    state = update(state, event, deps).state;
  };
  const effectRunner = createEffectRunner({
    // the fake client just runs the query function, which hits the mocked
    // fetchAsset and fetchTemplate
    queryClient: {
      fetchQuery: (options: { queryFn: () => unknown }) => options.queryFn(),
    } as unknown as QueryClient,
    getState: () => state,
    dispatch,
    handlers: {
      onAssetCreated: vi.fn(),
      onChildSaveFailed: vi.fn(),
      onCreateDropped: vi.fn(),
      onUploadSaveFailed: vi.fn(),
      ...handlers,
    },
  });
  return {
    effectRunner,
    log,
    dispatch,
    loggedTypes: () => log.map((event) => event.type),
    getState: () => state,
  };
}

function openExistingAsset(
  harness: ReturnType<typeof makeHarness>,
  key: string,
  assetId: string
) {
  harness.dispatch({
    type: "existingAssetRequested",
    key,
    parentLink: null,
    assetId,
  });
  harness.dispatch({
    type: "assetAndTemplateArrived",
    key,
    asset: makeAsset(assetId),
    template,
  });
}

function openDraft(
  harness: ReturnType<typeof makeHarness>,
  key: string,
  parentLink: {
    key: string;
    fieldTitle: string;
    itemUuid: string;
  } | null = null
) {
  harness.dispatch({
    type: "newAssetRequested",
    key,
    parentLink,
    collectionId: 1,
    templateId: 1,
  });
  harness.dispatch({ type: "templateArrived", key, templateId: 1, template });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocked.fetchTemplate.mockResolvedValue(template);
});

describe("fetchAssetAndTemplate", () => {
  it("dispatches the asset and its template and settles the waiter", async () => {
    const harness = makeHarness();
    mocked.fetchAsset.mockResolvedValue(makeAsset("A1"));

    harness.dispatch({
      type: "existingAssetRequested",
      key: "K1",
      parentLink: null,
      assetId: "A1",
    });
    const assetAndTemplateSettlement = harness.effectRunner.whenAssetAndTemplateSettles("K1");
    harness.effectRunner.runEffect({
      type: "fetchAssetAndTemplate",
      key: "K1",
      assetId: "A1",
    });

    await assetAndTemplateSettlement;
    expect(harness.loggedTypes()).toContain("assetAndTemplateArrived");
  });

  it("rejects the waiter with the fetch's own error", async () => {
    const harness = makeHarness();
    const notFound = new Error("410 gone");
    mocked.fetchAsset.mockRejectedValue(notFound);

    const assetAndTemplateSettlement = harness.effectRunner.whenAssetAndTemplateSettles("K1");
    harness.effectRunner.runEffect({
      type: "fetchAssetAndTemplate",
      key: "K1",
      assetId: "A1",
    });

    await expect(assetAndTemplateSettlement).rejects.toBe(notFound);
    expect(harness.loggedTypes()).toContain("assetLoadFailed");
  });
});

describe("an update save", () => {
  it("posts, then reads back inside the queue, in order", async () => {
    const harness = makeHarness();
    openExistingAsset(harness, "K1", "A1");
    mocked.updateAsset.mockResolvedValue({ objectId: "A1" });
    mocked.fetchAsset.mockResolvedValue(makeAsset("A1"));

    await harness.effectRunner.saveQueueFor("K1").save();

    const afterOpen = harness.loggedTypes().slice(2);
    expect(afterOpen).toEqual([
      "saveStarted",
      "saveAccepted",
      "assetAndTemplateArrived",
    ]);
  });

  it("marks the open asset failed and rejects when the post fails", async () => {
    const harness = makeHarness();
    openExistingAsset(harness, "K1", "A1");
    const serverError = new Error("500");
    mocked.updateAsset.mockRejectedValue(serverError);

    await expect(harness.effectRunner.saveQueueFor("K1").save()).rejects.toBe(
      serverError
    );
    const afterOpen = harness.loggedTypes().slice(2);
    expect(afterOpen).toContain("saveFailed");
    expect(afterOpen).not.toContain("assetAndTemplateArrived");
  });

  it("still succeeds when only the read-back fails", async () => {
    const harness = makeHarness();
    openExistingAsset(harness, "K1", "A1");
    mocked.updateAsset.mockResolvedValue({ objectId: "A1" });
    mocked.fetchAsset.mockRejectedValue(new Error("read back failed"));

    await harness.effectRunner.saveQueueFor("K1").save();

    expect(harness.loggedTypes()).toContain("saveAccepted");
    expect(harness.loggedTypes()).not.toContain("saveFailed");
  });
});

describe("a create save", () => {
  it("commits the new id before the read-back arrives", async () => {
    const harness = makeHarness();
    openDraft(harness, "K1");
    mocked.createAsset.mockResolvedValue({ objectId: "new-id" });
    mocked.fetchAsset.mockResolvedValue(makeAsset("new-id"));

    await harness.effectRunner.saveQueueFor("K1").save();

    const types = harness.loggedTypes();
    expect(types.indexOf("assetCreated")).toBeGreaterThan(-1);
    expect(types.indexOf("assetCreated")).toBeLessThan(
      types.indexOf("assetAndTemplateArrived")
    );
    expect(mocked.createAsset).toHaveBeenCalledTimes(1);
  });

  it("still succeeds with the id committed when the read-back fails", async () => {
    const harness = makeHarness();
    openDraft(harness, "K1");
    mocked.createAsset.mockResolvedValue({ objectId: "new-id" });
    mocked.fetchAsset.mockRejectedValue(new Error("read back failed"));

    await harness.effectRunner.saveQueueFor("K1").save();

    const openAsset = harness.getState().assets["K1"];
    expect(openAsset.status).toBe("editingExistingAsset");
    if (openAsset.status === "editingExistingAsset") {
      expect(openAsset.assetId).toBe("new-id");
    }
  });
});

describe("a parent save with a dirty child", () => {
  function openParentAndDirtyChild(harness: ReturnType<typeof makeHarness>) {
    openExistingAsset(harness, "P", "A1");
    openDraft(harness, "C", {
      key: "P",
      fieldTitle: "field_1",
      itemUuid: "item-1",
    });
    harness.dispatch({
      type: "widgetContentsEdited",
      key: "C",
      fieldTitle: "field_1",
      contents: [{ uuid: "c-row", fieldContents: "child text" }],
    });
  }

  it("saves the child before posting the parent", async () => {
    const harness = makeHarness();
    openParentAndDirtyChild(harness);
    mocked.createAsset.mockResolvedValue({ objectId: "child-id" });
    mocked.updateAsset.mockResolvedValue({ objectId: "A1" });
    mocked.fetchAsset.mockImplementation(async (assetId: string) =>
      makeAsset(assetId)
    );

    await harness.effectRunner.saveQueueFor("P").save();

    const createCall = mocked.createAsset.mock.invocationCallOrder[0];
    const updateCall = mocked.updateAsset.mock.invocationCallOrder[0];
    expect(createCall).toBeLessThan(updateCall);
  });

  it("saves the parent anyway and reports a child that failed", async () => {
    const onChildSaveFailed = vi.fn();
    const harness = makeHarness({ onChildSaveFailed });
    openParentAndDirtyChild(harness);
    const childError = new Error("child create failed");
    mocked.createAsset.mockRejectedValue(childError);
    mocked.updateAsset.mockResolvedValue({ objectId: "A1" });
    mocked.fetchAsset.mockResolvedValue(makeAsset("A1"));

    await harness.effectRunner.saveQueueFor("P").save();

    expect(onChildSaveFailed).toHaveBeenCalledWith(childError);
    expect(mocked.updateAsset).toHaveBeenCalledTimes(1);
  });
});

describe("the requestSave effect", () => {
  it("routes an auto-save failure to the page, since nothing awaits it", async () => {
    const onUploadSaveFailed = vi.fn();
    const harness = makeHarness({ onUploadSaveFailed });
    openExistingAsset(harness, "K1", "A1");
    const serverError = new Error("500");
    mocked.updateAsset.mockRejectedValue(serverError);

    harness.effectRunner.runEffect({ type: "requestSave", key: "K1" });
    await vi.waitFor(() =>
      expect(onUploadSaveFailed).toHaveBeenCalledWith(serverError)
    );
  });
});
