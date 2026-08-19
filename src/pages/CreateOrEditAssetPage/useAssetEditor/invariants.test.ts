/**
 * The three editor invariants as property tests, part of the editor's
 * contract:
 *
 * 1. No event sequence destroys an unsaved edit, except an accepted save
 *    that contains it (and the user's own discards: closing the editor,
 *    resetting, or overwriting the field again).
 * 2. What the user sees, and what a save snapshots, is always exactly the
 *    saved asset's snapshot with the overlay on top. Nothing is stitched
 *    from anywhere else.
 * 3. No event tagged with one key changes another key's open asset. The two
 *    deliberate exceptions are named in the test: a child's create stamps
 *    its id onto its parent, and opening a new root retires the old root.
 */

import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { equals } from "ramda";
import * as T from "@/types";
import {
  EditorDeps,
  EditorEvent,
  EditorState,
  initialEditorState,
} from "./types";
import { update } from "./update";
import { selectLocalAsset, selectOpenAsset } from "./selectors";

const makeTemplate = (templateId: number): T.Template =>
  ({
    templateId,
    widgetArray: [
      {
        widgetId: 1,
        type: "text",
        fieldTitle: "field_1",
        label: "Field 1",
      },
      {
        widgetId: 2,
        type: "text",
        fieldTitle: "field_2",
        label: "Field 2",
      },
    ],
  } as unknown as T.Template);

const TEMPLATES: Record<number, T.Template> = {
  1: makeTemplate(1),
  2: makeTemplate(2),
};

const makeAsset = (assetId: string, templateId: number): T.Asset =>
  ({
    assetId,
    templateId,
    readyForDisplay: true,
    collectionId: 1,
    availableAfter: null,
    modified: { date: "2026-01-01 00:00:00", timezone: "UTC" },
    modifiedBy: 1,
    createdBy: 1,
    deletedBy: null,
    relatedAssetCache: null,
    field_1: [{ uuid: "stored-1", fieldContents: "stored text" }],
  } as unknown as T.Asset);

const makeUnsavedAsset = (templateId: number): T.UnsavedAsset =>
  ({
    assetId: null,
    templateId,
    readyForDisplay: true,
    collectionId: 1,
    availableAfter: null,
    modified: null,
    modifiedBy: 1,
    createdBy: 1,
    deletedBy: null,
    relatedAssetCache: null,
  } as unknown as T.UnsavedAsset);

const makeDeps = (): EditorDeps => {
  let count = 0;
  return { createUuid: () => `created-${++count}` };
};

const KEYS = ["K1", "K2", "K3"];
const ASSET_IDS = ["A1", "A2"];
const FIELDS = ["field_1", "field_2"];

const arbKey = fc.constantFrom(...KEYS);
const arbTemplateId = fc.constantFrom(1, 2);
const arbAssetId = fc.constantFrom(...ASSET_IDS);

const arbContents = fc.array(
  fc.record({
    uuid: fc.string({ minLength: 4, maxLength: 8 }),
    fieldContents: fc.string({ maxLength: 10 }),
  }),
  { maxLength: 2 }
) as fc.Arbitrary<T.WidgetContent[]>;

const arbParentLink = fc.oneof(
  fc.constant(null),
  fc.record({
    key: arbKey,
    fieldTitle: fc.constantFrom(...FIELDS),
    itemUuid: fc.constant("item-1"),
  })
);

const arbEvent: fc.Arbitrary<EditorEvent> = fc.oneof(
  fc.record({
    type: fc.constant("widgetContentsEdited" as const),
    key: arbKey,
    fieldTitle: fc.constantFrom(...FIELDS),
    contents: arbContents,
  }),
  fc.record({
    type: fc.constant("uploadCompleted" as const),
    key: arbKey,
    fieldTitle: fc.constantFrom(...FIELDS),
    contents: arbContents,
  }),
  fc.record({
    type: fc.constant("collectionChanged" as const),
    key: arbKey,
    collectionId: fc.constantFrom(1, 2),
  }),
  fc.record({
    type: fc.constant("readyForDisplayChanged" as const),
    key: arbKey,
    readyForDisplay: fc.boolean(),
  }),
  fc.record({
    type: fc.constant("availableAfterChanged" as const),
    key: arbKey,
    availableAfter: fc.constant(null),
  }),
  fc.record({ type: fc.constant("resetRequested" as const) }),
  fc.record({
    type: fc.constant("newAssetRequested" as const),
    key: arbKey,
    parentLink: arbParentLink,
    collectionId: fc.constant(1),
    templateId: arbTemplateId,
  }),
  fc.record({
    type: fc.constant("existingAssetRequested" as const),
    key: arbKey,
    parentLink: arbParentLink,
    assetId: arbAssetId,
  }),
  fc.record({ type: fc.constant("closed" as const), key: arbKey }),
  arbTemplateId.chain((templateId) =>
    fc.record({
      type: fc.constant("templateArrived" as const),
      key: arbKey,
      templateId: fc.constant(templateId),
      template: fc.constant(TEMPLATES[templateId]),
    })
  ),
  fc.record({
    type: fc.constant("templateLoadFailed" as const),
    key: arbKey,
    templateId: arbTemplateId,
    error: fc.constant(new Error("template load failed")),
  }),
  fc
    .record({ assetId: arbAssetId, templateId: arbTemplateId })
    .chain(({ assetId, templateId }) =>
      fc.record({
        type: fc.constant("assetAndTemplateArrived" as const),
        key: arbKey,
        asset: fc.constant(makeAsset(assetId, templateId)),
        template: fc.constant(TEMPLATES[templateId]),
      })
    ),
  fc.record({
    type: fc.constant("assetLoadFailed" as const),
    key: arbKey,
    error: fc.constant(new Error("load failed")),
  }),
  fc.record({
    type: fc.constant("templateMigrationRequested" as const),
    key: arbKey,
    templateId: arbTemplateId,
  }),
  fc.record({
    type: fc.constant("assetCreated" as const),
    key: arbKey,
    assetId: arbAssetId,
    sentAsset: fc.constant(makeUnsavedAsset(1)),
  }),
  fc.record({ type: fc.constant("saveAccepted" as const), key: arbKey }),
  fc.record({ type: fc.constant("saveStarted" as const), key: arbKey }),
  fc.record({ type: fc.constant("saveFailed" as const), key: arbKey })
);

const arbEventSequence = fc.array(arbEvent, { maxLength: 30 });

function foldEvents(
  initial: EditorState,
  events: EditorEvent[],
  deps: EditorDeps
): EditorState {
  return events.reduce(
    (state, event) => update(state, event, deps).state,
    initial
  );
}

/** A state with K1 open on asset A1, its asset and template snapshotted. */
function stateWithOpenAsset(deps: EditorDeps): EditorState {
  return foldEvents(
    initialEditorState,
    [
      {
        type: "existingAssetRequested",
        key: "K1",
        parentLink: null,
        assetId: "A1",
      },
      {
        type: "assetAndTemplateArrived",
        key: "K1",
        asset: makeAsset("A1", 1),
        template: TEMPLATES[1],
      },
    ],
    deps
  );
}

describe("invariant 1: no event sequence destroys an unsaved edit", () => {
  // the excluded events are the legitimate ways an edit resolves: the
  // user overwrites the same field, an accepted save's read-back or create
  // delivers it, a migration re-derives the overlay, the user closes or
  // resets the editor, or the page opens a new root over this one
  const touchesTheEdit = (event: EditorEvent): boolean => {
    if (event.type === "resetRequested") return true;
    const isRootOpen =
      (event.type === "newAssetRequested" ||
        event.type === "existingAssetRequested") &&
      event.parentLink === null;
    if (isRootOpen) return true;
    if (event.key !== "K1") return false;
    switch (event.type) {
      case "widgetContentsEdited":
      case "uploadCompleted":
        return event.fieldTitle === "field_1";
      case "assetAndTemplateArrived":
        return event.asset.assetId === "A1";
      case "templateArrived":
      case "closed":
      case "newAssetRequested":
      case "existingAssetRequested":
        return true;
      default:
        return false;
    }
  };

  it("keeps the edited overlay through every other event", () => {
    fc.assert(
      fc.property(arbContents, arbEventSequence, (edited, events) => {
        const deps = makeDeps();
        const opened = stateWithOpenAsset(deps);
        const withEdit = update(
          opened,
          {
            type: "widgetContentsEdited",
            key: "K1",
            fieldTitle: "field_1",
            contents: edited,
          },
          deps
        ).state;

        const survivors = events.filter((event) => !touchesTheEdit(event));
        const finalState = foldEvents(withEdit, survivors, deps);

        const openAsset = selectOpenAsset(finalState, "K1");
        expect(openAsset?.status).toBe("editingExistingAsset");
        if (openAsset?.status !== "editingExistingAsset") return;
        expect(openAsset.edits.field_1).toEqual(edited);
      }),
      { numRuns: 300 }
    );
  });
});

describe("invariant 2: the visible asset is the saved asset plus overlay, always", () => {
  it("holds after every reachable state", () => {
    fc.assert(
      fc.property(arbEventSequence, (events) => {
        const deps = makeDeps();
        let state = initialEditorState;
        for (const event of events) {
          state = update(state, event, deps).state;
          for (const key of Object.keys(state.assets)) {
            const openAsset = state.assets[key];
            const visible = selectLocalAsset(state, key);
            if (openAsset.status === "editingNewAsset") {
              expect(visible).toBe(openAsset.draft);
            } else if (openAsset.status === "editingExistingAsset") {
              if (openAsset.savedAsset === null) {
                expect(visible).toBeNull();
              } else {
                expect(
                  equals(visible, {
                    ...openAsset.savedAsset,
                    ...openAsset.edits,
                  })
                ).toBe(true);
              }
            } else {
              expect(visible).toBeNull();
            }
          }
        }
      }),
      { numRuns: 300 }
    );
  });
});

describe("invariant 3: an event tagged with one key never changes another key's open asset", () => {
  it("leaves every unrelated open asset referentially identical", () => {
    fc.assert(
      fc.property(arbEventSequence, arbEvent, (history, event) => {
        if (!("key" in event)) return;
        const deps = makeDeps();
        const state = foldEvents(initialEditorState, history, deps);
        const next = update(state, event, deps).state;

        // the two deliberate cross-key effects: a create stamps the new id
        // onto the parent the child is linked under, and opening a new root
        // retires the old root
        const filledParentKey =
          event.type === "assetCreated"
            ? state.assets[event.key]?.parentLink?.key ?? null
            : null;
        const retiredRootKey =
          (event.type === "newAssetRequested" ||
            event.type === "existingAssetRequested") &&
          event.parentLink === null
            ? state.rootKey
            : null;

        for (const key of Object.keys(state.assets)) {
          if (key === event.key) continue;
          if (key === filledParentKey) continue;
          if (key === retiredRootKey) continue;
          expect(next.assets[key]).toBe(state.assets[key]);
        }
      }),
      { numRuns: 300 }
    );
  });
});
