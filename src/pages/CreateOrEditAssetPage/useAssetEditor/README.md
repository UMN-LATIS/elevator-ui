# useAssetEditor

The state layer of the asset editor: everything the create/edit page knows that is not rendering. The editor is this app's most critical surface, because a lost or corrupted edit is lost research data. That stake drove the design: every state transition is enumerable, pure, and tested, and the network code is confined to one file that makes no decisions of its own.

The directory is one Redux-style loop plus a Vue facade over it. Code calls `dispatch(event)`, the pure reducer returns the next state and any effects, the effect runner runs those effects, and their results come back through `dispatch` as new events. This README covers the state's shape, the save pipeline, and the invariants the design defends.

## File map

Functional core, pure and synchronous:

- [types.ts](./types.ts). The `EditorState` type (the editor's whole state), the `EditorEvent` type (every way that state can change), and the `EditorEffect` type (every effect the reducer can request). Start here.
- [update.ts](./update.ts). The one reducer that changes the state.
- [selectors.ts](./selectors.ts). Every derived read a component needs, so the state's shape stays private to this directory.
- [localAsset.ts](./localAsset.ts). Pure asset-document operations: building a new draft's local shape, snapshotting a fetched document as the saved asset, diffing, template migration, dirtiness.
- [toStoredShape.ts](./toStoredShape.ts). The asset as the server will store it. This file mirrors the backend's per-widget `hasContents()` drop rules, and it is the foundation of both dirtiness checks and save payloads.
- [toSaveableFormData.ts](./toSaveableFormData.ts). The wire form of a save request.

Imperative shell, where the async lives:

- [effectRunner.ts](./effectRunner.ts). The only place the editor talks to the network. It executes what the reducer asked for and dispatches the results back as events.
- [createSaveQueue.ts](./createSaveQueue.ts). Runs saves for one asset strictly one at a time, merging concurrent requests.
- [useAssetEditor.ts](./useAssetEditor.ts). The Vue facade, and the dispatch loop that joins the reducer to the effect runner. Components see a `reactive` object where every read is a selector and every method is a dispatch. It holds no editor state of its own.

Two test files double as documentation: [invariants.test.ts](./invariants.test.ts) states the three editor invariants as property tests, and [saveRoundTrip.test.ts](./saveRoundTrip.test.ts) records the save pipeline's ordering.

## The state

`EditorState` is a map of open assets, one per asset being edited. The page's own asset is the **root**. Each inline related-asset editor mounted under it (editing a child asset without leaving the page) gets its own entry, tied to its parent by a `ParentLink`: the parent's key, plus the related-asset item in the parent's document that the child's create will fill in.

Every open asset is addressed by an `EditSessionKey`, a uuid created fresh each time an asset is opened. The key is an identity doorman: fetches and saves are tagged with the key they were started for, so a response from a previous opening finds no open asset to write into and is dropped. Reopening the same asset gets a new key, which makes "stale response" and "wrong asset" the same, already-handled case.

An open asset with a loaded document holds a **working set**:

- For an existing asset: a `savedAsset` snapshot, the document as the server last returned it, taken at load so that later changes cannot touch it, plus `edits`, an overlay of unsaved field values. What the user sees is always `{ ...savedAsset, ...edits }`, computed by `selectLocalAsset`. Nothing is stitched from anywhere else.
- For a new asset: just a `draft`, the whole document, because there is no server copy to diff against.

The overlay is per whole field, last write wins. No edit in this app is finer than a field, so a field's value in `edits` completely replaces the saved asset's.

The open asset also snapshots the `template` the draft renders under. Server truth stays in the TanStack Query cache, and in-flight work stays in the effect runner, so the state holds exactly what the editor owns and nothing else.

## Dirtiness is measured in stored shape

The backend rebuilds the whole document from each save and drops any content row its `hasContents()` reads as empty. So a blank row on screen, uncleaned text-area html, or a newly created uuid can never be saved: the server would not store them, a save cannot settle them, and they must not read as unsaved work. `wouldSaveChangeStoredAsset` therefore normalizes both sides with `toStoredShape` (which applies the same drop rules and strips uuids) before comparing. This is why the leave guard does not nag on a create page the user never typed into, and why `edits` is allowed to hold entries that equal the saved asset: dirtiness never trusts the overlay's mere presence.

## The save pipeline

A save is a full-document replace on the server, which drives three design decisions:

1. **The asset and its template always come from the server, not the cache** (`staleTime: 0`), at open and at every read-back. Saving from a stale saved asset would overwrite whatever changed on the server since it was cached.
2. **Saves for one asset are strictly serialized** through a per-asset save queue, and the read-back runs inside the queue slot. The queue only releases once the saved asset reflects the save that just ran, so saved asset order equals save order by construction.
3. **Dirty children save before their parent.** A child's create must fill in its new assetId on the parent's related-asset item before the parent's save snapshots its document, or the server would drop the unlinked item.

One save round trip, as `runSave` in effectRunner.ts executes it:

```
save() on the open asset's queue
  ├─ save every dirty child first (each through its own queue)
  ├─ snapshot { ...savedAsset, ...edits } and convert with toSaveableFormData
  ├─ POST create or update
  │    ├─ create: dispatch assetCreated, which flips the open asset to
  │    │  editingExistingAsset with the sent snapshot as its saved asset
  │    └─ update: dispatch saveAccepted
  └─ read-back: fetch the stored document from the server, dispatch
     assetAndTemplateArrived, snapshot it, drop edits it made redundant
```

Edits made while the save was in flight survive: `assetAndTemplateArrived` re-diffs the on-screen document against the new saved asset, so anything the read-back did not deliver stays pending for the next save.

Failure handling follows one rule: an accepted save is never un-accepted, and a failure never costs an edit. A failed read-back just means the saved asset was not refreshed, and the next save or reload corrects it. A failed create keeps the draft. On an accepted create, the new assetId is committed at accept time, before any read-back, which is what makes a retry after a failed read-back an update instead of a second create. A create that resolves after its open asset closed cannot be applied, so the reducer emits `notifyCreateDropped` and the page tells the user an orphaned asset exists. A child's save failure is reported but does not abort its siblings or the parent (`Promise.allSettled`).

There is exactly one save no user asked for: a completed upload auto-saves (`uploadCompleted` returns a `requestSave` effect), because the uploaded file already exists on the server and an unsaved asset that does not reference it would leave it orphaned.

## Template migration

Migrating an asset to another template is an edit like any other: `templateId` lands in `edits`, and the draft starts rendering under the new template while the saved asset keeps saying what the server has. Until the migration is saved, `assetAndTemplateArrived` deliberately keeps the migrated template snapshotted rather than the server's. A failed template fetch clears the pending id and nothing else, so a failed swap cannot cost work in progress. Migration awaits any in-flight save first, because it diffs against the saved asset that save is about to replace.

## The Vue facade

[CreateOrEditAssetPage.vue](../CreateOrEditAssetPage.vue) calls `provideAssetEditor({ role: "root", handlers })`, which creates the editor context (the state, its dispatch loop, and the effect runner) and provides it. [InlineCreateOrEditAssetPage.vue](../InlineCreateOrEditAssetPage.vue) calls it with `role: "child"`, which injects that same shared context and opens its own asset on it. Widgets anywhere under either call `useAssetEditor()` to get the editor for their nearest provider.

The facade's `currentKey` ref is the only state the facade owns: which open asset this particular editor instance is looking at. Unmounting dispatches `closed`, which removes the open asset, so late async work finds nothing to write into.

## The invariants

[invariants.test.ts](./invariants.test.ts) property-tests these against arbitrary event sequences:

1. No event sequence destroys an unsaved edit, except an accepted save that contains it and the user's own discards (closing, resetting, overwriting the field again).
2. What the user sees, and what a save snapshots, is always exactly the saved asset snapshot with the overlay on top.
3. No event tagged with one key changes another key's open asset, with two deliberate exceptions: a child's create stamps its assetId onto its parent, and opening a new root retires the old root.

## Making changes

- A new way for state to change is a new `EditorEvent` case in update.ts, never a mutation elsewhere. If the change needs the network, the reducer returns an `EditorEffect` and effectRunner.ts grows a case for it.
- A new derived read is a selector in selectors.ts. Components never touch the state's shape directly.
- If code in effectRunner.ts wants to branch on the state, that decision belongs in the reducer.
- If the backend's storage rules change, toStoredShape.ts is the file that mirrors them, and its tests are the audit trail.
