import { describe, it, expect } from "vitest";
import {
  editorReducer,
  selectHasUnsavedEdits,
  type EditorEvent,
  type EditorModel,
} from "./editorReducer";

// these tests are about the model, not the commands a step emits
const reduce = (model: EditorModel, event: EditorEvent): EditorModel =>
  editorReducer(model, event).model;
import { makeLocalAssetFromSaved } from "./localAsset";
import type {
  Asset,
  PHPDateTime,
  Template,
  WidgetContent,
  WithUuid,
} from "@/types";

/**
 * The backend replaces the whole stored document on every save and drops any
 * content row it reads as empty, an empty fieldContents string included. So a
 * save's response is not always what the editor sent. These tests hold the
 * editor to that contract: once a response is applied, the editor settles,
 * meaning no unsaved edits remain and the rows on screen keep their ids.
 */

const makeTemplate = (
  templateId: number,
  widgetArray: Record<string, unknown>[]
): Template =>
  ({
    templateId,
    widgetArray: widgetArray.map((widget, index) => ({
      widgetId: index + 1,
      type: "text",
      fieldTitle: `field_${index + 1}`,
      ...widget,
    })),
  } as unknown as Template);

const savedDate: PHPDateTime = {
  date: "2026-01-01 00:00:00.000000",
  timezone: "UTC",
  timezone_type: 3,
};

// fields every asset needs that no test in this file cares about
const assetScaffolding = {
  templateId: 1,
  readyForDisplay: true,
  collectionId: 1,
  availableAfter: null,
  modifiedBy: 1,
  createdBy: 1,
  deletedBy: null,
  relatedAssetCache: null,
};

const makeSavedAsset = (overrides: Partial<Asset> = {}): Asset => ({
  ...assetScaffolding,
  assetId: "asset-123",
  modified: savedDate,
  ...overrides,
});

const EDITOR_GENERATION = 7;

const editingModel = (savedAsset: Asset): EditorModel => ({
  status: "editingExistingAsset",
  editorGeneration: EDITOR_GENERATION,
  savedAsset,
  edits: {},
});

describe("content ids across a save", () => {
  it("keeps a filled row's id when the server dropped the blank row above it", () => {
    const localAsset = makeLocalAssetFromSaved({
      template: makeTemplate(1, [{}]),
      savedAsset: makeSavedAsset({
        field_1: [{ fieldContents: "typed", isPrimary: false }],
      }),
      previousAsset: makeSavedAsset({
        field_1: [
          { fieldContents: "", isPrimary: false, uuid: "blank-row" },
          { fieldContents: "typed", isPrimary: false, uuid: "typed-row" },
        ],
      }),
    });

    const ids = (localAsset.field_1 as WithUuid<WidgetContent>[]).map(
      (content) => content.uuid
    );
    expect(ids).toEqual(["typed-row"]);
  });
});

describe("the editor settles once a save's response is applied", () => {
  it("reports no unsaved edits after saving a blank row the server never stores", () => {
    const template = makeTemplate(1, [{}]);
    const baseline = makeSavedAsset({
      field_1: [
        { fieldContents: "typed", isPrimary: false, uuid: "typed-row" },
      ],
    });
    let model = editingModel(baseline);

    // the user adds a second row and leaves it blank
    model = reduce(model, {
      type: "widgetContentsEdited",
      fieldTitle: "field_1",
      contents: [
        { fieldContents: "typed", isPrimary: false, uuid: "typed-row" },
        { fieldContents: "", isPrimary: false, uuid: "blank-row" },
      ] as WidgetContent[],
    });

    model = reduce(model, {
      type: "saveSucceeded",
      editorGeneration: EDITOR_GENERATION,
      savedAsset: makeSavedAsset({
        field_1: [{ fieldContents: "typed", isPrimary: false }],
      }),
      template,
    });

    expect(selectHasUnsavedEdits(model, template)).toBe(false);
  });

  it("reports no unsaved edits after the save cleaned the text area html", () => {
    const template = makeTemplate(1, [{ type: "text area" }]);
    const baseline = makeSavedAsset({
      field_1: [
        { fieldContents: "<p>Hello</p>", isPrimary: false, uuid: "row-1" },
      ],
    });
    let model = editingModel(baseline);

    // quill leaves a trailing empty paragraph as the user types
    model = reduce(model, {
      type: "widgetContentsEdited",
      fieldTitle: "field_1",
      contents: [
        {
          fieldContents: "<p>Hello there</p><p><br></p>",
          isPrimary: false,
          uuid: "row-1",
        },
      ] as WidgetContent[],
    });

    // toSaveableFormData strips the empty paragraph before sending, so the
    // server stores and echoes the cleaned html, not what the editor holds
    model = reduce(model, {
      type: "saveSucceeded",
      editorGeneration: EDITOR_GENERATION,
      savedAsset: makeSavedAsset({
        field_1: [{ fieldContents: "<p>Hello there</p>", isPrimary: false }],
      }),
      template,
    });

    expect(selectHasUnsavedEdits(model, template)).toBe(false);
  });

  it("reports no unsaved edits after the server echoes availableAfter as a full php date", () => {
    const template = makeTemplate(1, []);
    let model = editingModel(makeSavedAsset());

    // what the sidebar dispatches from its yyyy-mm-dd date input
    model = reduce(model, {
      type: "availableAfterChanged",
      availableAfter: { date: "2026-03-01", timezone_type: 3, timezone: "UTC" },
    });

    // the save sends only the date string and the server stores a DateTime,
    // which comes back with time and microseconds attached
    model = reduce(model, {
      type: "saveSucceeded",
      editorGeneration: EDITOR_GENERATION,
      savedAsset: makeSavedAsset({
        availableAfter: {
          date: "2026-03-01 00:00:00.000000",
          timezone_type: 3,
          timezone: "UTC",
        },
      }),
      template,
    });

    expect(selectHasUnsavedEdits(model, template)).toBe(false);
  });
});
